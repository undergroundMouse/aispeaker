import type {
  AppLanguage,
  DialogueResponseSegment,
  NetworkState,
  ProactivePromptCandidate,
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

export interface SpeakProactivePromptInput {
  prompt: ProactivePromptCandidate
  language: AppLanguage
  networkState: NetworkState
  userSpeaking?: boolean
}

export interface ProactivePromptQueueResult {
  status: 'queued' | 'spoken' | 'interrupted'
  prompt: ProactivePromptCandidate
  speechResult?: SpeechResponseResult
}

export class SpeechResponseController {
  private activeTurnId: string | null = null
  private activeProvider: TtsProvider | null = null
  private readonly providers: TtsProvider[]
  private readonly proactiveQueue: ProactivePromptCandidate[] = []

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
        if (event.type === 'cancel') {
          events.push(event)
          state = reduceSpeechState(state, event)
          applyMetricEvent(metrics, event)
        } else {
          providerSelection.provider.cancel('new-turn')
        }
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

  async speakProactivePrompt(input: SpeakProactivePromptInput): Promise<ProactivePromptQueueResult> {
    if (input.userSpeaking && input.prompt.priority !== 'urgent') {
      this.proactiveQueue.push(input.prompt)
      return { status: 'queued', prompt: input.prompt }
    }

    if (input.prompt.priority === 'urgent') {
      this.cancel('urgent-proactive-prompt')
    }

    const speechResult = await this.speakResponse({
      turnId: input.prompt.id,
      segments: [createDialogueSegment(input.prompt.id, input.prompt.text)],
      language: input.language,
      networkState: input.networkState,
      transcriptCommittedAt: input.prompt.createdAt,
    })

    return {
      status: input.prompt.priority === 'urgent' ? 'interrupted' : 'spoken',
      prompt: input.prompt,
      speechResult,
    }
  }

  async flushProactivePromptQueue({
    language,
    networkState,
  }: {
    language: AppLanguage
    networkState: NetworkState
  }): Promise<ProactivePromptQueueResult[]> {
    const prompts = this.proactiveQueue.splice(0)
    const results: ProactivePromptQueueResult[] = []

    for (const prompt of prompts) {
      results.push(
        await this.speakProactivePrompt({
          prompt,
          language,
          networkState,
          userSpeaking: false,
        }),
      )
    }

    return results
  }

  getQueuedProactivePromptCount(): number {
    return this.proactiveQueue.length
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
