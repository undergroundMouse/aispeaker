import type {
  AppLanguage,
  RealtimeSessionStatus,
  RouteDecisionPayload,
  ServerSessionMessage,
  SessionReadyPayload,
  SessionStartPayload,
  VisionDelta,
} from '@ai/shared'
import type { BackendClientConfig } from '../ai/backendClient'
import { buildRealtimeSessionWebSocketUrl } from '../ai/backendClient'
import {
  decodeServerMessage,
  encodeClientMessage,
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_BASE_MS,
  RECONNECT_MAX_MS,
} from './sessionProtocol'

export interface RealtimeSessionClientOptions {
  config: BackendClientConfig
  conversationId: string
  language: AppLanguage
  privacy: SessionStartPayload['privacy']
  onStatusChange?: (status: RealtimeSessionStatus) => void
  onReady?: (payload: SessionReadyPayload) => void
  onAsrInterim?: (text: string, confidence: number) => void
  onAsrFinal?: (text: string, turnId: string) => void
  onTtsChunk?: (seq: number, audioBase64: string) => void
  onTtsEnd?: (turnId: string) => void
  onRouteDecision?: (payload: RouteDecisionPayload) => void
  onError?: (code: string, message: string, recoverable: boolean) => void
  forceWss?: boolean
}

export class RealtimeSessionClient {
  private socket: WebSocket | null = null
  private status: RealtimeSessionStatus = 'disconnected'
  private seq = 0
  private lastAckSeq = 0
  private resumeToken: string | null = null
  private heartbeatTimer: number | null = null
  private reconnectAttempt = 0
  private disposed = false
  private readonly options: RealtimeSessionClientOptions

  constructor(options: RealtimeSessionClientOptions) {
    this.options = options
  }

  getStatus(): RealtimeSessionStatus {
    return this.status
  }

  getResumeToken(): string | null {
    return this.resumeToken
  }

  connect(): void {
    if (this.disposed) {
      return
    }

    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting')
    const url = buildRealtimeSessionWebSocketUrl(this.options.config, this.options.forceWss)
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectAttempt = 0
      this.setStatus('connected')
      this.startHeartbeat()
      if (this.resumeToken) {
        this.send({
          type: 'session.resume',
          payload: { resumeToken: this.resumeToken, lastAckSeq: this.lastAckSeq },
        })
      } else {
        this.send({
          type: 'session.start',
          payload: {
            conversationId: this.options.conversationId,
            language: this.options.language,
            capabilities: ['full-duplex', 'vision-l3'],
            privacy: this.options.privacy,
          },
        })
      }
    }

    this.socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      const message = decodeServerMessage(event.data)
      if (!message) {
        return
      }

      this.handleServerMessage(message)
    }

    this.socket.onerror = () => {
      this.options.onError?.('ws-error', 'Realtime session connection failed.', true)
    }

    this.socket.onclose = () => {
      this.clearHeartbeat()
      if (this.disposed) {
        this.setStatus('disconnected')
        return
      }

      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.disposed = true
    this.clearHeartbeat()
    this.socket?.close()
    this.socket = null
    this.setStatus('disconnected')
  }

  sendAudioChunk(pcm: ArrayBuffer, vadState: 'speech' | 'silence' | 'unknown'): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.seq += 1
    this.socket.send(pcm)
    this.send({ type: 'audio.chunk', seq: this.seq, vadState })
  }

  sendVisionDelta(delta: VisionDelta): void {
    this.seq += 1
    this.send({ type: 'vision.delta', seq: this.seq, delta })
  }

  sendBargeIn(reason: string): void {
    this.send({ type: 'barge-in', at: Date.now(), reason })
  }

  private send(message: Parameters<typeof encodeClientMessage>[0]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(encodeClientMessage(message))
  }

  private handleServerMessage(message: ServerSessionMessage): void {
    if (message.type === 'session.ready') {
      this.resumeToken = message.payload.resumeToken
      this.options.onReady?.(message.payload)
      return
    }

    if (message.type === 'asr.interim') {
      this.options.onAsrInterim?.(message.text, message.confidence)
      return
    }

    if (message.type === 'asr.final') {
      this.options.onAsrFinal?.(message.text, message.turnId)
      return
    }

    if (message.type === 'tts.chunk') {
      this.options.onTtsChunk?.(message.seq, message.audioBase64)
      return
    }

    if (message.type === 'tts.end') {
      this.options.onTtsEnd?.(message.turnId)
      return
    }

    if (message.type === 'route.decision') {
      this.options.onRouteDecision?.(message.payload)
      return
    }

    if (message.type === 'ack') {
      this.lastAckSeq = message.seq
      return
    }

    if (message.type === 'session.error') {
      this.options.onError?.(message.payload.code, message.payload.message, message.payload.recoverable)
      if (!message.payload.recoverable) {
        this.setStatus('error')
      }
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

  private setStatus(status: RealtimeSessionStatus): void {
    this.status = status
    this.options.onStatusChange?.(status)
  }
}
