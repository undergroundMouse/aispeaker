import type { BackendClientConfig } from '../ai/backendClient'
import { buildAsrWebSocketUrl } from '../ai/backendClient'
import type {
  AppLanguage,
  AsrEvent,
  AsrProvider,
  AsrProviderCapabilities,
  AsrProviderKind,
  AsrRequest,
} from '../types'
import { createPcmCaptureAudioContext, startPcm16Capture, type PcmAudioCaptureSession } from './pcmAudioCapture'

const MAX_BUFFERED_FRAMES = 120
const FRAME_SEND_INTERVAL_MS = 100
const STOP_WAIT_TIMEOUT_MS = 8_000

type ClientAsrMessage =
  | { type: 'ready' }
  | { type: 'interim'; text: string }
  | { type: 'final'; text: string }
  | { type: 'ended'; transcript: string }
  | { type: 'error'; message: string }

export interface CloudStreamingAsrDeps {
  getBackendConfig: () => BackendClientConfig | null
  getMicrophoneStream: () => MediaStream | null
  isEnabled: () => boolean
}

export class CloudStreamingAsrProvider implements AsrProvider {
  readonly kind: AsrProviderKind = 'cloud-streaming'
  private readonly deps: CloudStreamingAsrDeps
  private socket: WebSocket | null = null
  private captureSession: PcmAudioCaptureSession | null = null
  private captureAudioContext: AudioContext | null = null
  private activeTurnId: string | null = null
  private onEvent: ((event: AsrEvent) => void) | null = null
  private latestTranscript = ''
  private stopResolver: ((transcript: string) => void) | null = null
  private streamingReady = false
  private pendingFrames: ArrayBuffer[] = []
  private outboundFrames: ArrayBuffer[] = []
  private sendTimer: number | null = null
  private stopRequested = false
  private stopSent = false
  private captureEpoch = 0

  constructor(deps: CloudStreamingAsrDeps) {
    this.deps = deps
  }

  getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
    const backend = this.deps.getBackendConfig()
    const microphone = this.deps.getMicrophoneStream()
    const enabled = this.deps.isEnabled()

    return {
      kind: this.kind,
      available: Boolean(backend && microphone && enabled && typeof WebSocket !== 'undefined'),
      local: false,
      supportsInterimResults: true,
      supportsLanguage: true,
    }
  }

  startSession(request: AsrRequest, onEvent: (event: AsrEvent) => void): void {
    const backend = this.deps.getBackendConfig()
    const microphone = this.deps.getMicrophoneStream()

    if (!backend || !microphone) {
      onEvent({
        type: 'error',
        at: Date.now(),
        provider: this.kind,
        turnId: request.turnId,
        message: 'Cloud speech recognition is unavailable.',
      })
      return
    }

    this.cancel()
    this.activeTurnId = request.turnId
    this.onEvent = onEvent
    this.latestTranscript = ''
    this.streamingReady = false
    this.pendingFrames = []
    this.outboundFrames = []
    this.stopRequested = false
    this.stopSent = false
    const captureEpoch = ++this.captureEpoch

    this.captureAudioContext = createPcmCaptureAudioContext()
    void this.beginCapture(microphone, request.turnId, this.captureAudioContext, captureEpoch)

    const socket = new WebSocket(buildAsrWebSocketUrl(backend))
    this.socket = socket

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'start',
          turnId: request.turnId,
          language: request.language,
        }),
      )
    }

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      const message = JSON.parse(event.data) as ClientAsrMessage
      this.handleClientMessage(request.turnId, message)
    }

    socket.onerror = () => {
      this.emitError(request.turnId, 'Cloud speech recognition connection failed.')
    }

    socket.onclose = () => {
      this.resolveStop(this.latestTranscript)
    }
  }

  stopSession(): Promise<string> {
    return new Promise((resolve) => {
      let settled = false
      const finish = (transcript: string) => {
        if (settled) {
          return
        }

        settled = true
        window.clearTimeout(timeoutId)
        this.clearSendTimer()
        this.stopResolver = null
        resolve(transcript.trim())
      }

      this.stopResolver = finish

      const timeoutId = window.setTimeout(() => {
        finish(this.latestTranscript)
        this.cancel()
      }, STOP_WAIT_TIMEOUT_MS)

      void (async () => {
        await this.captureSession?.stop()
        this.captureSession = null
        this.stopRequested = true
        this.requestStopWhenReady()
      })()
    })
  }

  cancel(): void {
    this.captureEpoch += 1
    this.clearSendTimer()
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close()
    }
    this.socket = null
    this.activeTurnId = null
    this.onEvent = null
    this.stopResolver = null
    this.latestTranscript = ''
    this.streamingReady = false
    this.pendingFrames = []
    this.outboundFrames = []
    this.stopRequested = false
    this.stopSent = false
    void this.captureSession?.stop()
    this.captureSession = null
    void this.captureAudioContext?.close()
    this.captureAudioContext = null
  }

  private handleClientMessage(turnId: string, message: ClientAsrMessage): void {
    if (turnId !== this.activeTurnId || !this.onEvent) {
      return
    }

    if (message.type === 'ready') {
      this.streamingReady = true
      this.onEvent({ type: 'start', at: Date.now(), provider: this.kind, turnId })
      this.enqueueFrames(this.pendingFrames)
      this.pendingFrames = []
      this.ensureSendLoop()
      this.requestStopWhenReady()
      return
    }

    if (message.type === 'interim') {
      this.latestTranscript = message.text
      this.onEvent({
        type: 'interim',
        at: Date.now(),
        provider: this.kind,
        turnId,
        text: message.text,
      })
      return
    }

    if (message.type === 'final') {
      this.latestTranscript = message.text
      this.onEvent({
        type: 'final',
        at: Date.now(),
        provider: this.kind,
        turnId,
        text: message.text,
      })
      return
    }

    if (message.type === 'ended') {
      this.latestTranscript = message.transcript
      this.onEvent({ type: 'end', at: Date.now(), provider: this.kind, turnId })
      void this.captureSession?.stop()
      this.captureSession = null
      void this.captureAudioContext?.close()
      this.captureAudioContext = null
      this.resolveStop(message.transcript)
      this.socket?.close()
      return
    }

    if (message.type === 'error') {
      this.emitError(turnId, message.message)
    }
  }

  private async beginCapture(
    microphone: MediaStream,
    turnId: string,
    audioContext: AudioContext,
    captureEpoch: number,
  ): Promise<void> {
    try {
      const captureSession = await startPcm16Capture(
        microphone,
        (frame) => {
          this.handleAudioFrame(frame)
        },
        { audioContext },
      )

      if (captureEpoch !== this.captureEpoch || turnId !== this.activeTurnId) {
        await captureSession.stop()
        return
      }

      this.captureSession = captureSession
    } catch (error) {
      if (captureEpoch !== this.captureEpoch || turnId !== this.activeTurnId) {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to capture microphone audio.'
      this.emitError(turnId, message)
    }
  }

  private handleAudioFrame(frame: ArrayBuffer): void {
    if (this.streamingReady) {
      this.enqueueFrames([frame])
      this.ensureSendLoop()
      return
    }

    if (this.pendingFrames.length < MAX_BUFFERED_FRAMES) {
      this.pendingFrames.push(frame.slice(0))
    }
  }

  private enqueueFrames(frames: ArrayBuffer[]): void {
    this.outboundFrames.push(...frames)
  }

  private ensureSendLoop(): void {
    if (this.sendTimer !== null || !this.streamingReady) {
      return
    }

    this.sendTimer = window.setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return
      }

      const next = this.outboundFrames.shift()
      if (next) {
        this.socket.send(next)
        return
      }

      if (this.stopRequested) {
        this.requestStopWhenReady()
      }
    }, FRAME_SEND_INTERVAL_MS)
  }

  private requestStopWhenReady(): void {
    if (!this.stopRequested || this.stopSent) {
      return
    }

    if (!this.streamingReady || this.outboundFrames.length > 0) {
      this.ensureSendLoop()
      return
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.stopSent = true
      this.socket.send(JSON.stringify({ type: 'stop' }))
      return
    }

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.resolveStop(this.latestTranscript)
      this.cancel()
    }
  }

  private clearSendTimer(): void {
    if (this.sendTimer !== null) {
      window.clearInterval(this.sendTimer)
      this.sendTimer = null
    }
  }

  private resolveStop(transcript: string): void {
    if (!this.stopResolver) {
      return
    }

    this.stopResolver(transcript)
    this.stopResolver = null
  }

  private emitError(turnId: string, message: string): void {
    this.onEvent?.({
      type: 'error',
      at: Date.now(),
      provider: this.kind,
      turnId,
      message,
    })
    this.cancel()
  }
}
