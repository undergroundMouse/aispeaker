import type {
  AppLanguage,
  AsrEvent,
  AsrProvider,
  AsrProviderCapabilities,
  AsrProviderKind,
  AsrRequest,
} from '../types'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export interface AsrProviderSelection {
  provider: AsrProvider | null
  fallbackUsed: boolean
  capabilities: AsrProviderCapabilities[]
}

export class WebSpeechAsrProvider implements AsrProvider {
  readonly kind: AsrProviderKind = 'web-speech'
  private recognition: SpeechRecognitionLike | null = null
  private lastInterim = ''
  private lastFinal = ''

  getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
    const recognition = getBrowserSpeechRecognition()
    return {
      kind: this.kind,
      available: Boolean(recognition),
      local: true,
      supportsInterimResults: true,
      supportsLanguage: Boolean(recognition),
    }
  }

  startSession(request: AsrRequest, onEvent: (event: AsrEvent) => void): void {
    const Recognition = getBrowserSpeechRecognition()
    if (!Recognition) {
      onEvent({
        type: 'error',
        at: Date.now(),
        provider: this.kind,
        turnId: request.turnId,
        message: 'Speech recognition is unavailable.',
      })
      return
    }

    this.cancel()
    this.lastInterim = ''
    this.lastFinal = ''
    this.recognition = new Recognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = request.language === 'zh' ? 'zh-CN' : 'en-US'

    this.recognition.onstart = () => {
      onEvent({ type: 'start', at: Date.now(), provider: this.kind, turnId: request.turnId })
    }

    this.recognition.onresult = (event) => {
      let finalized = ''
      let interim = ''
      let newFinal = ''

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result?.[0]?.transcript ?? ''
        if (result?.isFinal) {
          finalized += transcript
        } else {
          interim += transcript
        }
      }

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result?.[0]?.transcript ?? ''
        if (result?.isFinal) {
          newFinal += transcript
        }
      }

      const displayText = `${finalized}${interim}`.trim()
      if (displayText) {
        this.lastInterim = displayText
        onEvent({
          type: 'interim',
          at: Date.now(),
          provider: this.kind,
          turnId: request.turnId,
          text: displayText,
        })
      }

      if (newFinal) {
        this.lastFinal = `${this.lastFinal}${newFinal}`.trim()
        onEvent({
          type: 'final',
          at: Date.now(),
          provider: this.kind,
          turnId: request.turnId,
          text: newFinal,
        })
      }
    }

    this.recognition.onerror = (event) => {
      onEvent({
        type: 'error',
        at: Date.now(),
        provider: this.kind,
        turnId: request.turnId,
        message: event.error || 'Speech recognition failed.',
      })
    }

    this.recognition.start()
  }

  stopSession(): Promise<string> {
    const recognition = this.recognition
    if (!recognition) {
      return Promise.resolve((this.lastFinal || this.lastInterim).trim())
    }

    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) {
          return
        }

        settled = true
        window.clearTimeout(timeoutId)
        const transcript = (this.lastFinal || this.lastInterim).trim()
        this.recognition = null
        resolve(transcript)
      }

      recognition.onend = finish
      recognition.onerror = () => {
        finish()
      }

      const timeoutId = window.setTimeout(finish, 2_000)

      try {
        recognition.stop()
      } catch {
        finish()
      }
    })
  }

  cancel(): void {
    this.recognition?.abort()
    this.recognition = null
    this.lastInterim = ''
    this.lastFinal = ''
  }
}

export class MockAsrProvider implements AsrProvider {
  readonly kind: AsrProviderKind = 'mock'
  private activeTurnId: string | null = null
  private transcript = ''
  private onEvent: ((event: AsrEvent) => void) | null = null
  private readonly configuredTranscript: string

  constructor(configuredTranscript = '你好') {
    this.configuredTranscript = configuredTranscript
  }

  getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
    return {
      kind: this.kind,
      available: this.configuredTranscript.trim().length > 0,
      local: true,
      supportsInterimResults: true,
      supportsLanguage: true,
    }
  }

  startSession(request: AsrRequest, onEvent: (event: AsrEvent) => void): void {
    this.cancel()
    this.activeTurnId = request.turnId
    this.onEvent = onEvent
    this.transcript = this.configuredTranscript
    onEvent({ type: 'start', at: Date.now(), provider: this.kind, turnId: request.turnId })
    onEvent({
      type: 'interim',
      at: Date.now(),
      provider: this.kind,
      turnId: request.turnId,
      text: this.transcript,
    })
  }

  async stopSession(): Promise<string> {
    if (!this.activeTurnId || !this.onEvent) {
      return ''
    }

    const turnId = this.activeTurnId
    this.onEvent({
      type: 'final',
      at: Date.now(),
      provider: this.kind,
      turnId,
      text: this.transcript,
    })
    this.onEvent({ type: 'end', at: Date.now(), provider: this.kind, turnId })
    const text = this.transcript
    this.cancel()
    return text
  }

  cancel(): void {
    this.activeTurnId = null
    this.onEvent = null
    this.transcript = ''
  }
}

export { CloudStreamingAsrProvider, type CloudStreamingAsrDeps } from './cloudStreamingAsrProvider'

export function selectAsrProvider({
  providers,
  language,
  preferMock = false,
}: {
  providers: AsrProvider[]
  language: AppLanguage
  preferMock?: boolean
}): AsrProviderSelection {
  const capabilities = providers.map((provider) => provider.getCapabilities(language))
  const orderedKinds: AsrProviderKind[] = preferMock
    ? ['mock', 'web-speech', 'cloud-streaming']
    : ['web-speech', 'cloud-streaming', 'mock']

  for (const kind of orderedKinds) {
    const provider = providers.find((candidate) => candidate.kind === kind)
    const capability = capabilities.find((entry) => entry.kind === kind)
    if (provider && capability?.available) {
      return {
        provider,
        fallbackUsed: kind !== orderedKinds[0],
        capabilities,
      }
    }
  }

  return { provider: null, fallbackUsed: false, capabilities }
}

function getBrowserSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const scope = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}
