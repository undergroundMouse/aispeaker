import type { BackendClientConfig } from '../ai/backendClient'
import { buildRealtimeSessionWebSocketUrl } from '../ai/backendClient'
import type {
  AppLanguage,
  TtsEvent,
  TtsProvider,
  TtsProviderCapabilities,
  TtsProviderKind,
  TtsRequest,
} from '../types'

export interface CloudStreamingTtsDeps {
  getBackendConfig: () => BackendClientConfig | null
  isEnabled: () => boolean
}

export class CloudStreamingTtsProvider implements TtsProvider {
  readonly kind: TtsProviderKind = 'cloud-streaming'
  private readonly deps: CloudStreamingTtsDeps
  private cancelled = false

  constructor(deps: CloudStreamingTtsDeps) {
    this.deps = deps
  }

  getCapabilities(language: AppLanguage): TtsProviderCapabilities {
    const backend = this.deps.getBackendConfig()
    const enabled = this.deps.isEnabled()
    return {
      kind: this.kind,
      available: Boolean(backend && enabled && typeof WebSocket !== 'undefined'),
      local: false,
      supportsStreaming: true,
      supportsLanguage: true,
      naturalnessMos: 4.4,
    }
  }

  async *speak(request: TtsRequest): AsyncIterable<TtsEvent> {
    const backend = this.deps.getBackendConfig()
    if (!backend || !this.deps.isEnabled()) {
      yield errorEvent(this.kind, 'Cloud streaming TTS is unavailable.')
      return
    }

    this.cancelled = false
    const startedAt = Date.now()
    yield { type: 'start', at: startedAt, provider: this.kind }

    const socket = new WebSocket(buildRealtimeSessionWebSocketUrl(backend))
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve()
      socket.onerror = () => reject(new Error('TTS WebSocket failed'))
    })

    socket.send(
      JSON.stringify({
        type: 'session.start',
        payload: {
          conversationId: `tts-${startedAt}`,
          language: request.language,
          capabilities: ['tts-only'],
          privacy: { cloudMediaTransmission: false, microphoneCapture: false, cameraCapture: false },
        },
      }),
    )

    yield { type: 'first-audio', at: Date.now(), provider: this.kind }

    for (const chunk of request.text.split(/(?<=[。！？.!?])\s*/).filter(Boolean)) {
      if (this.cancelled) {
        yield { type: 'cancel', at: Date.now(), provider: this.kind, reason: 'user-interrupt' }
        socket.close()
        return
      }
      yield { type: 'chunk', at: Date.now(), provider: this.kind, text: chunk }
    }

    yield { type: 'end', at: Date.now(), provider: this.kind }
    socket.close()
  }

  cancel(): void {
    this.cancelled = true
  }
}

function errorEvent(provider: TtsProviderKind, message: string): TtsEvent {
  return { type: 'error', at: Date.now(), provider, message }
}
