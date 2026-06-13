import type {
  AppLanguage,
  DialogueResponseSegment,
  NetworkState,
  SpeechPlaybackState,
  SpeechResponseResult,
  TtsCancellationReason,
  TtsEvent,
  TtsProvider,
  VoiceLatencyMetrics,
} from '../types'
import { selectTtsProvider, splitSpeakableSegments } from './ttsProviders'

export interface SpeakResponseInput {
  turnId: string
  segments: DialogueResponseSegment[]
  language: AppLanguage
  networkState: NetworkState
  speechCaptureStartedAt?: number
  speechCaptureEndedAt?: number
  transcriptCommittedAt?: number
  preferCloudTts?: boolean
}

export class SpeechResponseController {
  private activeTurnId: string | null = null
  private activeProvider: TtsProvider | null = null
  private readonly providers: TtsProvider[]

  constructor(providers: TtsProvider[]) {
    this.providers = providers
  }

  async speakResponse(input: SpeakResponseInput): Promise<SpeechResponseResult> {
    this.cancel('new-turn')
    this.activeTurnId = input.turnId

    const providerSelection = selectTtsProvider({
      providers: this.providers,
      language: input.language,
      networkState: input.networkState,
      preferCloud: input.preferCloudTts,
    })

    const metrics: VoiceLatencyMetrics = {
      turnId: input.turnId,
      speechCaptureStartedAt: input.speechCaptureStartedAt,
      speechCaptureEndedAt: input.speechCaptureEndedAt,
      transcriptCommittedAt: input.transcriptCommittedAt,
      aiFirstSegmentAt: input.segments[0]?.receivedAt,
    }

    if (!providerSelection.provider) {
      const completedAt = Date.now()
      return {
        state: {
          status: 'unavailable',
          provider: null,
          currentTurnId: input.turnId,
          fallbackUsed: false,
          errorMessage: 'No supported TTS provider is available.',
          cancellationReason: null,
        },
        metrics: completeMetrics(metrics, completedAt),
        events: [],
      }
    }

    this.activeProvider = providerSelection.provider

    const text = buildSpeakableText(input.segments)
    const events: TtsEvent[] = []
    let state: SpeechPlaybackState = {
      status: 'preparing',
      provider: providerSelection.provider.kind,
      currentTurnId: input.turnId,
      fallbackUsed: providerSelection.fallbackUsed,
      errorMessage: null,
      cancellationReason: null,
    }

    for await (const event of providerSelection.provider.speak({
      turnId: input.turnId,
      text,
      language: input.language,
    })) {
      if (this.activeTurnId !== input.turnId) {
        providerSelection.provider.cancel('new-turn')
        break
      }

      events.push(event)
      state = reduceSpeechState(state, event)
      applyMetricEvent(metrics, event)
    }

    const completedAt = metrics.completedAt ?? Date.now()
    return {
      state,
      metrics: completeMetrics(metrics, completedAt),
      events,
    }
  }

  cancel(reason: TtsCancellationReason): void {
    this.activeProvider?.cancel(reason)
    this.activeTurnId = null
  }
}

export function createDialogueSegment(turnId: string, text: string, isFinal = true): DialogueResponseSegment {
  return {
    turnId,
    text,
    isFinal,
    receivedAt: Date.now(),
  }
}

export function buildSpeakableText(segments: DialogueResponseSegment[]): string {
  return segments
    .flatMap((segment) => splitSpeakableSegments(segment.text))
    .join(' ')
    .trim()
}

export function reduceSpeechState(state: SpeechPlaybackState, event: TtsEvent): SpeechPlaybackState {
  if (event.type === 'start') {
    return { ...state, status: 'preparing', provider: event.provider }
  }

  if (event.type === 'first-audio' || event.type === 'chunk') {
    return { ...state, status: 'speaking', provider: event.provider }
  }

  if (event.type === 'end') {
    return { ...state, status: 'completed', provider: event.provider }
  }

  if (event.type === 'cancel') {
    return {
      ...state,
      status: 'cancelled',
      provider: event.provider,
      cancellationReason: event.reason,
    }
  }

  return {
    ...state,
    status: 'failed',
    provider: event.provider,
    errorMessage: event.message,
    cancellationReason: 'provider-error',
  }
}

export function applyMetricEvent(metrics: VoiceLatencyMetrics, event: TtsEvent): void {
  if (event.type === 'start') {
    metrics.ttsStartedAt = metrics.ttsStartedAt ?? event.at
  }

  if (event.type === 'first-audio') {
    metrics.firstPlaybackAt = metrics.firstPlaybackAt ?? event.at
  }

  if (event.type === 'end' || event.type === 'cancel' || event.type === 'error') {
    metrics.completedAt = event.at
  }
}

export function completeMetrics(metrics: VoiceLatencyMetrics, completedAt: number): VoiceLatencyMetrics {
  const startAt = metrics.speechCaptureEndedAt ?? metrics.transcriptCommittedAt ?? metrics.aiFirstSegmentAt
  const responseAt = metrics.firstPlaybackAt ?? metrics.ttsStartedAt ?? completedAt
  const responseLatencyMs = startAt === undefined ? undefined : Math.max(0, responseAt - startAt)

  return {
    ...metrics,
    completedAt,
    responseLatencyMs,
    metThreeSecondRequirement: responseLatencyMs === undefined ? undefined : responseLatencyMs < 3_000,
    metTwoPointFiveSecondTarget: responseLatencyMs === undefined ? undefined : responseLatencyMs < 2_500,
  }
}
