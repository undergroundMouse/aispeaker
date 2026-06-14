import type {
  AppLanguage,
  OmniSessionBootstrapPayload,
  OmniSessionStatus,
  OmniUpstreamServerEvent,
} from '@ai/shared'
import type { BackendClientConfig } from '../ai/backendClient'
import { buildOmniRealtimeWebSocketUrl } from '../ai/backendClient'
import { OmniPcmPlaybackQueue } from './omniPcmPlayback'
import {
  decodeServerOmniMessage,
  encodeClientOmniMessage,
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_BASE_MS,
  RECONNECT_MAX_MS,
} from './omniRealtimeProtocol'

export interface OmniRealtimeClientOptions {
  config: BackendClientConfig
  conversationId: string
  language: AppLanguage
  instructions?: string
  onStatusChange?: (status: OmniSessionStatus) => void
  onReady?: (payload: { sessionId: string; model: string }) => void
  onUserTranscriptInterim?: (text: string) => void
  onUserTranscriptFinal?: (text: string) => void
  onAssistantTranscriptDelta?: (text: string) => void
  onAssistantTranscriptDone?: (text: string) => void
  onBargeIn?: () => void
  onResponseDone?: (usage?: { totalTokens?: number }) => void
  onError?: (code: string, message: string, recoverable: boolean) => void
  forceWss?: boolean
}

export class OmniRealtimeClient {
  private socket: WebSocket | null = null
  private status: OmniSessionStatus = 'disconnected'
  private heartbeatTimer: number | null = null
  private reconnectAttempt = 0
  private disposed = false
  private closing = false
  private assistantTranscript = ''
  private readonly playback: OmniPcmPlaybackQueue
  private readonly options: OmniRealtimeClientOptions

  constructor(options: OmniRealtimeClientOptions) {
    this.options = options
    this.playback = new OmniPcmPlaybackQueue()
  }

  getStatus(): OmniSessionStatus {
    return this.status
  }

  connect(): void {
    if (this.disposed) {
      return
    }

    this.closing = false
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting')
    const url = buildOmniRealtimeWebSocketUrl(this.options.config, this.options.forceWss)
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectAttempt = 0
      this.setStatus('connected')
      this.startHeartbeat()
      this.sendBootstrap()
    }

    this.socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      const message = decodeServerOmniMessage(event.data)
      if (!message) {
        return
      }

      this.handleServerMessage(message)
    }

    this.socket.onerror = () => {
      if (this.closing || this.disposed) {
        return
      }

      this.options.onError?.('ws-error', 'Omni Realtime connection failed.', true)
    }

    this.socket.onclose = () => {
      this.clearHeartbeat()
      if (this.disposed) {
        this.setStatus('disconnected')
        return
      }

      if (this.closing) {
        this.closing = false
        this.setStatus('disconnected')
        return
      }

      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.closing = true
    this.disposed = true
    this.clearHeartbeat()
    this.socket?.close()
    this.socket = null
    this.setStatus('disconnected')
    void this.playback.close()
  }

  appendAudioPcm16(pcm: ArrayBuffer): void {
    const bytes = new Uint8Array(pcm)
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index] ?? 0)
    }

    this.send({
      type: 'omni.event',
      event: {
        type: 'input_audio_buffer.append',
        audio: btoa(binary),
      },
    })
  }

  updateSessionInstructions(instructions: string): void {
    this.send({
      type: 'omni.event',
      event: {
        type: 'session.update',
        session: { instructions },
      },
    })
  }

  appendImageBase64(imageBase64: string): void {
    this.send({
      type: 'omni.event',
      event: {
        type: 'input_image_buffer.append',
        image: imageBase64,
      },
    })
  }

  appendImageDataUrl(dataUrl: string): void {
    const base64 = dataUrl.includes(',') ? (dataUrl.split(',')[1] ?? '') : dataUrl
    if (base64) {
      this.appendImageBase64(base64)
    }
  }

  private sendBootstrap(): void {
    const payload: OmniSessionBootstrapPayload = {
      conversationId: this.options.conversationId,
      language: this.options.language,
      instructions: this.options.instructions,
    }

    this.send({ type: 'session.bootstrap', payload })
  }

  private send(message: Parameters<typeof encodeClientOmniMessage>[0]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(encodeClientOmniMessage(message))
  }

  private handleServerMessage(message: ReturnType<typeof decodeServerOmniMessage>): void {
    if (!message) {
      return
    }

    if (message.type === 'session.ready') {
      this.options.onReady?.(message.payload)
      return
    }

    if (message.type === 'session.error') {
      this.options.onError?.(message.payload.code, message.payload.message, message.payload.recoverable)
      if (!message.payload.recoverable) {
        this.setStatus('error')
      }
      return
    }

    if (message.type === 'heartbeat') {
      return
    }

    if (message.type === 'omni.event') {
      this.handleOmniEvent(message.event)
    }
  }

  private handleOmniEvent(event: OmniUpstreamServerEvent): void {
    switch (event.type) {
      case 'conversation.item.input_audio_transcription.delta': {
        const delta = typeof event.delta === 'string' ? event.delta : ''
        if (delta) {
          this.options.onUserTranscriptInterim?.(delta)
        }
        break
      }
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = typeof event.transcript === 'string' ? event.transcript : ''
        if (transcript) {
          this.options.onUserTranscriptFinal?.(transcript)
        }
        break
      }
      case 'response.audio_transcript.delta': {
        const delta = typeof event.delta === 'string' ? event.delta : ''
        if (delta) {
          this.assistantTranscript += delta
          this.options.onAssistantTranscriptDelta?.(this.assistantTranscript)
        }
        break
      }
      case 'response.audio_transcript.done': {
        const transcript =
          typeof event.transcript === 'string' ? event.transcript : this.assistantTranscript
        this.assistantTranscript = ''
        if (transcript) {
          this.options.onAssistantTranscriptDone?.(transcript)
        }
        break
      }
      case 'input_audio_buffer.speech_started':
        this.playback.reset()
        this.options.onBargeIn?.()
        break
      case 'response.audio.delta': {
        const delta = typeof event.delta === 'string' ? event.delta : ''
        if (delta) {
          this.playback.enqueueBase64Pcm(delta)
        }
        break
      }
      case 'response.audio.done':
      case 'response.done': {
        this.playback.reset()
        const usage = event.response as { usage?: { total_tokens?: number } } | undefined
        this.options.onResponseDone?.({
          totalTokens: usage?.usage?.total_tokens,
        })
        break
      }
      default:
        break
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'heartbeat', at: Date.now() })
    }, HEARTBEAT_INTERVAL_MS)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) {
      return
    }

    this.reconnectAttempt += 1
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** (this.reconnectAttempt - 1), RECONNECT_MAX_MS)
    this.setStatus('reconnecting')
    window.setTimeout(() => {
      if (!this.disposed) {
        this.connect()
      }
    }, delay)
  }

  private setStatus(status: OmniSessionStatus): void {
    this.status = status
    this.options.onStatusChange?.(status)
  }
}
