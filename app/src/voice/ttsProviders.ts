import type {
  AppLanguage,
  NetworkState,
  TtsCancellationReason,
  TtsEvent,
  TtsProvider,
  TtsProviderCapabilities,
  TtsProviderKind,
  TtsRequest,
} from '../types'

interface SpeechSynthesisLike {
  cancel: () => void
  getVoices: () => SpeechSynthesisVoice[]
  speak: (utterance: SpeechSynthesisUtterance) => void
}

export interface TtsProviderSelection {
  provider: TtsProvider | null
  fallbackUsed: boolean
  capabilities: TtsProviderCapabilities[]
}

export class WebSpeechTtsProvider implements TtsProvider {
  readonly kind: TtsProviderKind = 'web-speech'
  private readonly synthesis: SpeechSynthesisLike | null

  constructor(synthesis: SpeechSynthesisLike | null = getBrowserSpeechSynthesis()) {
    this.synthesis = synthesis
  }

  getCapabilities(language: AppLanguage): TtsProviderCapabilities {
    const languageSupported = this.synthesis ? hasLanguageVoice(this.synthesis.getVoices(), language) : false

    return {
      kind: this.kind,
      available: Boolean(this.synthesis),
      local: true,
      supportsStreaming: false,
      supportsLanguage: languageSupported || Boolean(this.synthesis),
      naturalnessMos: 4.1,
    }
  }

  async *speak(request: TtsRequest): AsyncIterable<TtsEvent> {
    if (!this.synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      yield errorEvent(this.kind, 'Web Speech API is unavailable.')
      return
    }

    const startedAt = Date.now()
    yield { type: 'start', at: startedAt, provider: this.kind }

    const utterance = new SpeechSynthesisUtterance(request.text)
    utterance.lang = request.language === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = request.settings?.rate ?? 1
    utterance.pitch = request.settings?.pitch ?? 1
    utterance.volume = request.settings?.volume ?? 1

    const selectedVoice = selectVoice(this.synthesis.getVoices(), request.language, request.settings?.voiceName)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    let firstAudioEmitted = false
    let resolveFirstAudio: ((event: TtsEvent) => void) | null = null
    let resolveFinished: ((event: TtsEvent) => void) | null = null
    const firstAudio = new Promise<TtsEvent>((resolve) => {
      resolveFirstAudio = resolve
    })
    const finished = new Promise<TtsEvent>((resolve) => {
      resolveFinished = resolve
    })

    const emitFirstAudio = () => {
      if (firstAudioEmitted) {
        return
      }

      firstAudioEmitted = true
      resolveFirstAudio?.({ type: 'first-audio', at: Date.now(), provider: this.kind })
    }

    const finish = (event: TtsEvent) => {
      emitFirstAudio()
      resolveFinished?.(event)
    }

    utterance.onstart = () => {
      emitFirstAudio()
    }
    utterance.onend = () => {
      finish({ type: 'end', at: Date.now(), provider: this.kind })
    }
    utterance.onerror = (event) => {
      finish(errorEvent(this.kind, event.error || 'Speech synthesis failed.'))
    }

    this.synthesis.speak(utterance)

    yield await firstAudio
    const finalEvent = await finished
    if (finalEvent.type !== 'first-audio') {
      yield finalEvent
    }
  }

  cancel(): void {
    this.synthesis?.cancel()
  }
}

export class MockStreamingTtsProvider implements TtsProvider {
  readonly kind: TtsProviderKind
  private cancelledReason: TtsCancellationReason | null = null
  private readonly options: {
    kind?: TtsProviderKind
    available?: boolean
    local?: boolean
    supportsStreaming?: boolean
    naturalnessMos?: number
  }

  constructor(
    options: {
      kind?: TtsProviderKind
      available?: boolean
      local?: boolean
      supportsStreaming?: boolean
      naturalnessMos?: number
    } = {},
  ) {
    this.options = options
    this.kind = options.kind ?? 'mock'
  }

  getCapabilities(language: AppLanguage): TtsProviderCapabilities {
    void language

    return {
      kind: this.kind,
      available: this.options.available ?? true,
      local: this.options.local ?? true,
      supportsStreaming: this.options.supportsStreaming ?? true,
      supportsLanguage: true,
      naturalnessMos: this.options.naturalnessMos ?? 4.3,
    }
  }

  async *speak(request: TtsRequest): AsyncIterable<TtsEvent> {
    if (this.options.available === false) {
      yield errorEvent(this.kind, 'TTS provider is unavailable.')
      return
    }

    yield { type: 'start', at: Date.now(), provider: this.kind }
    yield { type: 'first-audio', at: Date.now(), provider: this.kind }

    for (const chunk of splitSpeakableSegments(request.text)) {
      if (this.cancelledReason) {
        yield { type: 'cancel', at: Date.now(), provider: this.kind, reason: this.cancelledReason }
        this.cancelledReason = null
        return
      }

      yield { type: 'chunk', at: Date.now(), provider: this.kind, text: chunk }
    }

    yield { type: 'end', at: Date.now(), provider: this.kind }
  }

  cancel(reason: TtsCancellationReason): void {
    this.cancelledReason = reason
  }
}

export class CloudStreamingTtsProvider extends MockStreamingTtsProvider {
  constructor(available = false) {
    super({
      kind: 'cloud-streaming',
      available,
      local: false,
      supportsStreaming: true,
      naturalnessMos: 4.4,
    })
  }
}

export function selectTtsProvider({
  providers,
  language,
  networkState,
  preferCloud = false,
}: {
  providers: TtsProvider[]
  language: AppLanguage
  networkState: NetworkState
  preferCloud?: boolean
}): TtsProviderSelection {
  const capabilities = providers.map((provider) => provider.getCapabilities(language))
  const available = providers.filter((_provider, index) => {
    const capability = capabilities[index]
    return capability?.available && capability.supportsLanguage
  })

  const cloudProvider = available.find((provider) => provider.getCapabilities(language).kind === 'cloud-streaming')
  const localProvider = available.find((provider) => provider.getCapabilities(language).local)

  if (preferCloud && networkState === 'online' && cloudProvider) {
    return { provider: cloudProvider, fallbackUsed: false, capabilities }
  }

  if (localProvider) {
    return { provider: localProvider, fallbackUsed: preferCloud && networkState !== 'online', capabilities }
  }

  return { provider: available[0] ?? null, fallbackUsed: false, capabilities }
}

export function splitSpeakableSegments(text: string): string[] {
  return text
    .split(/(?<=[。！？.!?])\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function getBrowserSpeechSynthesis(): SpeechSynthesisLike | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null
  }

  return window.speechSynthesis
}

function hasLanguageVoice(voices: SpeechSynthesisVoice[], language: AppLanguage): boolean {
  const prefix = language === 'zh' ? 'zh' : 'en'
  return voices.length === 0 || voices.some((voice) => voice.lang.toLocaleLowerCase().startsWith(prefix))
}

function selectVoice(
  voices: SpeechSynthesisVoice[],
  language: AppLanguage,
  preferredName?: string,
): SpeechSynthesisVoice | null {
  if (preferredName) {
    const preferred = voices.find((voice) => voice.name === preferredName)
    if (preferred) {
      return preferred
    }
  }

  const prefix = language === 'zh' ? 'zh' : 'en'
  return voices.find((voice) => voice.lang.toLocaleLowerCase().startsWith(prefix)) ?? null
}

function errorEvent(provider: TtsProviderKind, message: string): TtsEvent {
  return { type: 'error', at: Date.now(), provider, message }
}
