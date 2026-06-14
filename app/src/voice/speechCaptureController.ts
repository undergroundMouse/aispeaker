import type {
  AppLanguage,
  AsrCaptureResult,
  AsrCaptureState,
  AsrEvent,
  AsrProvider,
  AsrProviderKind,
} from '../types'
import { selectAsrProvider } from './asrProviders'

const FINALIZE_TIMEOUT_MS = 1_500
const CLOUD_ASR_SILENCE_FALLBACK_MS = 2_500
const NON_RECOVERABLE_WEB_SPEECH_ERRORS = new Set(['no-speech', 'aborted'])

export class SpeechCaptureController {
  private readonly providers: AsrProvider[]
  private activeProvider: AsrProvider | null = null
  private activeTurnId: string | null = null
  private activeLanguage: AppLanguage = 'zh'
  private preferMock = false
  private startedAt = 0
  private state: AsrCaptureState = createIdleState()
  private onStateChange: ((state: AsrCaptureState) => void) | null = null
  private lastErrorMessage: string | null = null
  private cloudSilenceFallbackTimer: number | null = null

  constructor(providers: AsrProvider[]) {
    this.providers = providers
  }

  setStateListener(listener: ((state: AsrCaptureState) => void) | null): void {
    this.onStateChange = listener
    listener?.(this.state)
  }

  getState(): AsrCaptureState {
    return this.state
  }

  getLastErrorMessage(): string | null {
    return this.lastErrorMessage
  }

  start({ turnId, language, preferMock = false }: { turnId: string; language: AppLanguage; preferMock?: boolean }): void {
    this.activeLanguage = language
    this.preferMock = preferMock
    this.lastErrorMessage = null
    const selection = selectAsrProvider({
      providers: this.providers,
      language,
      preferMock,
    })

    if (!selection.provider) {
      this.updateState({
        status: 'unavailable',
        provider: null,
        currentTurnId: turnId,
        interimText: '',
        finalText: '',
        errorMessage: 'No supported ASR provider is available.',
      })
      return
    }

    this.activeProvider?.cancel()
    this.activeProvider = selection.provider
    this.activeTurnId = turnId
    this.startedAt = Date.now()

    this.updateState({
      status: 'listening',
      provider: selection.provider.kind,
      currentTurnId: turnId,
      interimText: '',
      finalText: '',
      errorMessage: null,
    })

    selection.provider.startSession({ turnId, language }, (event) => this.handleEvent(event))
    this.scheduleCloudSilenceFallback(selection.provider.kind)
  }

  async stop(): Promise<AsrCaptureResult | null> {
    this.clearCloudSilenceFallback()
    if (!this.activeProvider || !this.activeTurnId) {
      return null
    }

    const turnId = this.activeTurnId
    const speechCaptureStartedAt = this.startedAt
    this.updateState({
      ...this.state,
      status: 'committing',
      currentTurnId: turnId,
    })

    const provider = this.activeProvider
    const directTranscript = (await provider.stopSession()).trim()
    const finalizedTranscript = await waitForAsrFinalize(
      () => directTranscript || this.state.finalText || this.state.interimText,
    )
    const transcript = finalizedTranscript.trim()
    const speechCaptureEndedAt = Date.now()
    const committedAt = speechCaptureEndedAt
    const captureErrorMessage = this.state.errorMessage

    this.activeProvider = null
    this.activeTurnId = null
    this.updateState(createIdleState())

    if (!transcript) {
      this.lastErrorMessage =
        this.lastErrorMessage ?? captureErrorMessage ?? 'No speech detected.'
      return null
    }

    return {
      turnId,
      transcript,
      committedAt,
      speechCaptureStartedAt,
      speechCaptureEndedAt,
    }
  }

  cancel(): void {
    this.clearCloudSilenceFallback()
    this.activeProvider?.cancel()
    this.activeProvider = null
    this.activeTurnId = null
    this.updateState(createIdleState())
  }

  private handleEvent(event: AsrEvent): void {
    if (event.turnId !== this.activeTurnId) {
      return
    }

    if (event.type === 'interim') {
      this.clearCloudSilenceFallback()
      this.updateState({
        ...this.state,
        interimText: event.text,
      })
      return
    }

    if (event.type === 'final') {
      this.clearCloudSilenceFallback()
      const finalText = `${this.state.finalText} ${event.text}`.trim()
      this.updateState({
        ...this.state,
        finalText,
        interimText: event.text,
      })
      return
    }

    if (event.type === 'error') {
      this.clearCloudSilenceFallback()
      this.lastErrorMessage = event.message
      const failedProvider = this.activeProvider
      const recoverable =
        event.provider === 'cloud-streaming' ||
        (event.provider === 'web-speech' && !NON_RECOVERABLE_WEB_SPEECH_ERRORS.has(event.message))

      if (recoverable) {
        this.tryFallbackAsr(event.provider)
      }

      if (!this.activeProvider || this.activeProvider === failedProvider) {
        this.updateState({
          status: 'failed',
          provider: event.provider,
          currentTurnId: event.turnId,
          interimText: this.state.interimText,
          finalText: this.state.finalText,
          errorMessage: event.message,
        })
      }
    }
  }

  private scheduleCloudSilenceFallback(providerKind: AsrProviderKind): void {
    this.clearCloudSilenceFallback()

    if (providerKind !== 'cloud-streaming') {
      return
    }

    this.cloudSilenceFallbackTimer = window.setTimeout(() => {
      this.cloudSilenceFallbackTimer = null
      if (
        this.activeProvider?.kind !== 'cloud-streaming' ||
        this.state.status !== 'listening' ||
        this.state.interimText.trim() ||
        this.state.finalText.trim()
      ) {
        return
      }

      this.tryFallbackAsr('cloud-streaming')
    }, CLOUD_ASR_SILENCE_FALLBACK_MS)
  }

  private clearCloudSilenceFallback(): void {
    if (this.cloudSilenceFallbackTimer !== null) {
      window.clearTimeout(this.cloudSilenceFallbackTimer)
      this.cloudSilenceFallbackTimer = null
    }
  }

  private tryFallbackAsr(failedKind: AsrProviderKind): void {
    if (!this.activeTurnId) {
      return
    }

    const orderedKinds: AsrProviderKind[] = this.preferMock
      ? ['mock', 'web-speech']
      : failedKind === 'cloud-streaming'
        ? ['web-speech', 'mock']
        : failedKind === 'web-speech'
          ? ['cloud-streaming', 'mock']
          : []

    for (const kind of orderedKinds) {
      if (kind === failedKind) {
        continue
      }

      const provider = this.providers.find((candidate) => candidate.kind === kind)
      if (!provider || !provider.getCapabilities(this.activeLanguage).available) {
        continue
      }

      this.activeProvider?.cancel()
      this.activeProvider = provider
      this.updateState({
        status: 'listening',
        provider: kind,
        currentTurnId: this.activeTurnId,
        interimText: '',
        finalText: '',
        errorMessage: null,
      })
      provider.startSession(
        { turnId: this.activeTurnId, language: this.activeLanguage },
        (nextEvent) => this.handleEvent(nextEvent),
      )
      this.scheduleCloudSilenceFallback(kind)
      return
    }
  }

  private updateState(state: AsrCaptureState): void {
    this.state = state
    this.onStateChange?.(state)
  }
}

function createIdleState(): AsrCaptureState {
  return {
    status: 'idle',
    provider: null,
    currentTurnId: null,
    interimText: '',
    finalText: '',
    errorMessage: null,
  }
}

export async function waitForAsrFinalize(
  getText: () => string,
  timeoutMs = FINALIZE_TIMEOUT_MS,
): Promise<string> {
  const started = Date.now()
  let latest = getText()

  while (Date.now() - started < timeoutMs) {
    latest = getText()
    if (latest.trim()) {
      return latest.trim()
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }

  return latest.trim()
}
