import { describe, expect, it } from 'vitest'
import { MockStreamingTtsProvider } from './ttsProviders'
import {
  SpeechResponseController,
  buildSpeakableText,
  completeMetrics,
  createDialogueSegment,
} from './speechResponseController'
import type { ProactivePromptCandidate } from '../types'

describe('SpeechResponseController', () => {
  it('starts streaming speech from the first response segment and records latency', async () => {
    const controller = new SpeechResponseController([new MockStreamingTtsProvider()])
    const result = await controller.speakResponse({
      turnId: 'turn-1',
      segments: [createDialogueSegment('turn-1', '这是杯子。还有一本书。')],
      language: 'zh',
      networkState: 'online',
      transcriptCommittedAt: Date.now() - 100,
    })

    expect(result.state.status).toBe('completed')
    expect(result.events.some((event) => event.type === 'first-audio')).toBe(true)
    expect(result.events.filter((event) => event.type === 'chunk')).toHaveLength(2)
    expect(result.metrics.metThreeSecondRequirement).toBe(true)
    expect(result.metrics.metTwoPointFiveSecondTarget).toBe(true)
  })

  it('builds speakable text from streamed answer segments', () => {
    expect(
      buildSpeakableText([
        { turnId: 'turn-1', text: 'Hello.', isFinal: false, receivedAt: 1 },
        { turnId: 'turn-1', text: 'How can I help?', isFinal: true, receivedAt: 2 },
      ]),
    ).toBe('Hello. How can I help?')
  })

  it('marks the three second requirement and two point five second target separately', () => {
    const metrics = completeMetrics(
      {
        turnId: 'turn-1',
        transcriptCommittedAt: 1_000,
        firstPlaybackAt: 3_700,
      },
      4_000,
    )

    expect(metrics.responseLatencyMs).toBe(2_700)
    expect(metrics.metThreeSecondRequirement).toBe(true)
    expect(metrics.metTwoPointFiveSecondTarget).toBe(false)
  })

  it('queues non-urgent proactive prompts while the user is speaking and flushes them later', async () => {
    const controller = new SpeechResponseController([new MockStreamingTtsProvider()])
    const prompt = createPrompt({ priority: 'normal' })

    const queued = await controller.speakProactivePrompt({
      prompt,
      language: 'zh',
      networkState: 'online',
      userSpeaking: true,
    })

    expect(queued.status).toBe('queued')
    expect(controller.getQueuedProactivePromptCount()).toBe(1)

    const flushed = await controller.flushProactivePromptQueue({
      language: 'zh',
      networkState: 'online',
    })

    expect(flushed[0]?.status).toBe('spoken')
    expect(flushed[0]?.speechResult?.state.status).toBe('completed')
    expect(controller.getQueuedProactivePromptCount()).toBe(0)
  })

  it('allows urgent proactive prompts to interrupt active speech path', async () => {
    const controller = new SpeechResponseController([new MockStreamingTtsProvider()])

    const result = await controller.speakProactivePrompt({
      prompt: createPrompt({ priority: 'urgent', severity: 'safety' }),
      language: 'zh',
      networkState: 'online',
      userSpeaking: true,
    })

    expect(result.status).toBe('interrupted')
    expect(result.speechResult?.state.status).toBe('completed')
  })

  it('uses the existing TTS unavailable fallback for proactive prompts', async () => {
    const controller = new SpeechResponseController([])
    const result = await controller.speakProactivePrompt({
      prompt: createPrompt(),
      language: 'zh',
      networkState: 'online',
    })

    expect(result.status).toBe('spoken')
    expect(result.speechResult?.state.status).toBe('unavailable')
  })
})

function createPrompt(overrides: Partial<ProactivePromptCandidate> = {}): ProactivePromptCandidate {
  return {
    id: 'prompt-1',
    ruleId: 'delivery-person-at-door',
    promptKey: 'delivery-person-at-door',
    text: '快递员似乎在门口',
    confidence: 0.95,
    severity: 'info',
    priority: 'normal',
    source: 'local-rules',
    labels: ['delivery-person'],
    regions: [],
    createdAt: Date.now(),
    ...overrides,
  }
}
