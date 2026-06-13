import { describe, expect, it } from 'vitest'
import type { CloudVisualQuestionRequest, SampledVideoFrame } from '../types'
import { emptyConversationMemory } from './conversationMemory'
import { MockCloudVisualLanguageProvider } from './cloudVisualLanguage'
import {
  OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT,
  appendObjectRecognitionConstraint,
  buildObjectRecognitionPrompt,
  isUncertainObjectAnswer,
} from './objectRecognitionPrompt'
import { normalizeProviderVisualAnswer } from './cloudVisualLanguage'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

function createRequest(): CloudVisualQuestionRequest {
  return {
    transcript: '这是什么',
    frame,
    language: 'zh',
    memory: emptyConversationMemory(),
    localVision: {
      sceneCandidates: [],
      objectCandidates: [],
      gestures: [],
      analyzedAt: 1,
      shouldUseCloud: true,
    },
  }
}

describe('objectRecognitionPrompt', () => {
  it('appends the uncertainty constraint to object prompts', () => {
    const prompt = buildObjectRecognitionPrompt('这是什么', 'zh')
    expect(prompt).toContain(OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT)
    expect(appendObjectRecognitionConstraint('test')).toContain("看不清楚")
  })

  it('returns uncertain cloud answers without invented evidence', async () => {
    const provider = new MockCloudVisualLanguageProvider({ forceUncertainty: true })
    const answer = await provider.answerVisualQuestion(createRequest())

    expect(answer.answer).toContain('看不清楚')
    expect(answer.evidenceAvailable).toBe(false)
    expect(answer.regions).toHaveLength(0)
  })

  it('normalizes uncertain answers without highlights', () => {
    const normalized = normalizeProviderVisualAnswer(
      {
        kind: 'object',
        answer: "I'm not sure, 看不清楚",
        source: 'cloud',
        referencedEntities: [{ label: 'cup', confidence: 0.2 }],
        regions: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.2 }],
        evidenceAvailable: true,
        requiresSpeech: true,
      },
      'zh',
    )

    expect(isUncertainObjectAnswer(normalized.answer)).toBe(true)
    expect(normalized.evidenceAvailable).toBe(false)
    expect(normalized.regions).toHaveLength(0)
  })
})
