import { randomUUID } from 'node:crypto'
import WebSocket from 'ws'
import type { AppLanguage } from '@ai/shared'
import type { ServerConfig } from '../config.js'

export interface QwenOmniRealtimeSessionOptions {
  apiKey: string
  model: string
  baseUrl: string
  language: AppLanguage
  voice: string
  turnDetection: 'server_vad' | 'semantic_vad'
  silenceDurationMs: number
  instructions?: string
}

export type OmniUpstreamEvent = Record<string, unknown> & { type: string }

export function buildOmniUpstreamUrl(baseUrl: string, model: string): string {
  const url = new URL(baseUrl)
  url.searchParams.set('model', model)
  return url.toString()
}

export function buildDefaultOmniSessionUpdate(options: {
  language: AppLanguage
  voice: string
  turnDetection: 'server_vad' | 'semantic_vad'
  silenceDurationMs?: number
  instructions?: string
}): Record<string, unknown> {
  const instructions =
    options.instructions ??
    (options.language === 'zh'
      ? '你是 AISpeaker 助手，用简洁自然的中文与用户对话。'
      : 'You are the AISpeaker assistant. Respond naturally and concisely in English.')

  return {
    modalities: ['text', 'audio'],
    voice: options.voice,
    input_audio_format: 'pcm',
    output_audio_format: 'pcm',
    instructions,
    input_audio_transcription: {
      model: 'qwen3-asr-flash-realtime',
    },
    turn_detection: {
      type: options.turnDetection,
      threshold: 0.5,
      silence_duration_ms: options.silenceDurationMs ?? 500,
    },
  }
}

export function createOmniEventId(): string {
  return `event_${randomUUID().replace(/-/g, '')}`
}

export function optionsFromServerConfig(
  config: ServerConfig,
  language: AppLanguage,
  instructions?: string,
): QwenOmniRealtimeSessionOptions | null {
  if (!config.qwenApiKey) {
    return null
  }

  return {
    apiKey: config.qwenApiKey,
    model: config.qwenOmniRealtimeModel,
    baseUrl: config.qwenOmniRealtimeBaseUrl,
    language,
    voice: config.qwenOmniVoice,
    turnDetection: config.qwenOmniTurnDetection,
    silenceDurationMs: config.qwenOmniSilenceDurationMs,
    instructions,
  }
}

export class QwenOmniRealtimeSession {
  private socket: WebSocket | null = null
  private sessionConfigured = false
  private readonly sessionId = randomUUID()

  constructor(private readonly options: QwenOmniRealtimeSessionOptions) {}

  getSessionId(): string {
    return this.sessionId
  }

  async connect(onEvent: (event: OmniUpstreamEvent) => void): Promise<void> {
    const url = buildOmniUpstreamUrl(this.options.baseUrl, this.options.model)

    await new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      })

      this.socket.on('open', () => {
        resolve()
      })

      this.socket.on('message', (data) => {
        if (typeof data !== 'string') {
          return
        }

        let event: OmniUpstreamEvent
        try {
          event = JSON.parse(data) as OmniUpstreamEvent
        } catch {
          return
        }

        if (event.type === 'session.created' && !this.sessionConfigured) {
          this.sessionConfigured = true
          this.sendEvent({
            type: 'session.update',
            event_id: createOmniEventId(),
            session: buildDefaultOmniSessionUpdate({
              language: this.options.language,
              voice: this.options.voice,
              turnDetection: this.options.turnDetection,
              silenceDurationMs: this.options.silenceDurationMs,
              instructions: this.options.instructions,
            }),
          })
        }

        onEvent(event)
      })

      this.socket.on('error', (error) => {
        reject(error)
      })
    })
  }

  sendEvent(event: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(JSON.stringify(event))
  }

  close(): void {
    this.socket?.close()
    this.socket = null
  }
}
