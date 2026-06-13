import { describe, expect, it } from 'vitest'
import type { CloudVisualQuestionRequest, SampledVideoFrame } from '../types'
import { emptyConversationMemory } from './conversationMemory'
import { MockCloudVisualLanguageProvider } from './cloudVisualLanguage'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

function createRequest(): CloudVisualQuestionRequest {
  return {
    transcript: 'what is this',
    frame,
    language: 'en',
    memory: emptyConversationMemory(),
    localVision: {
      sceneCandidates: [],
      objectCandidates: [
        {
          label: 'cup',
          confidence: 0.7,
          region: { x: 0.1, y: 0.2, width: 0.3, height: 0.4, label: 'cup' },
        },
      ],
      gestures: [],
      analyzedAt: 1,
      shouldUseCloud: true,
    },
  }
}

describe('MockCloudVisualLanguageProvider', () => {
  it('normalizes answers and preserves region coordinates', async () => {
    const provider = new MockCloudVisualLanguageProvider()

    const answer = await provider.answerVisualQuestion(createRequest())

    expect(answer.source).toBe('cloud')
    expect(answer.kind).toBe('object')
    expect(answer.referencedEntities[0]?.label).toBe('cup')
    expect(answer.evidenceAvailable).toBe(true)
    expect(answer.regions[0]).toMatchObject({ label: 'cup' })
    expect(answer.explanation).toContain('cup')
  })
})
