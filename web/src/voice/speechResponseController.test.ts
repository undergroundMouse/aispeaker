import { describe, expect, it } from 'vitest'
import { MockStreamingTtsProvider } from './ttsProviders'
import {
  SpeechResponseController,
  buildSpeakableText,
  completeMetrics,
  createDialogueSegment,
} from './speechResponseController'

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
})
