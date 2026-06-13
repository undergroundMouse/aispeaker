import { describe, expect, it } from 'vitest'
import { emptyConversationMemory, updateConversationMemory } from './conversationMemory'
import { MockCloudVisualLanguageProvider, normalizeProviderVisualAnswer } from './cloudVisualLanguage'
import { MockLocalVisionAnalyzer } from './localVision'
import { MultimodalDialogueService } from './multimodalDialogue'
import type { SampledVideoFrame, VisualAnswer, VisionRegion } from '../types'
import {
  buildSpeakableAnswerText,
  buildWhyFollowUpAnswer,
  createActiveVisualEvidence,
  isEvidencePayloadWithinBudget,
  isVisualEvidenceExpired,
  normalizeCloudVisualAnswer,
  serializeEvidencePayload,
  uncertaintyAnswer,
} from './visualEvidence'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

const appleRegion: VisionRegion = {
  x: 0.3,
  y: 0.25,
  width: 0.2,
  height: 0.25,
  label: 'apple',
}

describe('visualEvidence', () => {
  it('keeps serialized evidence payloads under 200 bytes', () => {
    const payload = serializeEvidencePayload([appleRegion, { ...appleRegion, label: 'stem' }])
    expect(new TextEncoder().encode(payload).length).toBeLessThanOrEqual(200)
    expect(isEvidencePayloadWithinBudget([appleRegion])).toBe(true)
  })

  it('marks cloud answers without coordinates as evidence unavailable', () => {
    const normalized = normalizeCloudVisualAnswer(
      {
        kind: 'object',
        answer: 'This is an apple.',
        source: 'cloud',
        referencedEntities: [{ label: 'apple', confidence: 0.8 }],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      'en',
    )

    expect(normalized.evidenceAvailable).toBe(false)
    expect(normalized.regions).toEqual([])
  })

  it('builds speakable text with bundled explanation', () => {
    const answer: VisualAnswer = {
      kind: 'object',
      answer: '这是 apple。',
      explanation: '因为红圆形状和叶柄。',
      source: 'local',
      referencedEntities: [{ label: 'apple', confidence: 0.9 }],
      regions: [appleRegion],
      evidenceAvailable: true,
      requiresSpeech: true,
    }

    expect(buildSpeakableAnswerText(answer)).toContain('因为红圆形状和叶柄')
  })

  it('creates and expires active visual evidence', () => {
    const answer: VisualAnswer = {
      kind: 'object',
      answer: '这是 apple。',
      explanation: '因为红圆形状和叶柄。',
      source: 'local',
      referencedEntities: [{ label: 'apple', confidence: 0.9 }],
      regions: [appleRegion],
      evidenceAvailable: true,
      requiresSpeech: true,
    }

    const evidence = createActiveVisualEvidence(answer, 1_000)
    expect(evidence?.regions).toEqual([appleRegion])
    expect(isVisualEvidenceExpired(evidence!, 8_500)).toBe(false)
    expect(isVisualEvidenceExpired(evidence!, 9_001)).toBe(true)
  })
})

describe('why follow-up evidence reuse', () => {
  it('answers why questions from recent memory evidence', async () => {
    const service = new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({
        objectCandidates: [{ label: 'cup', confidence: 0.9, region: appleRegion }],
      }),
    })

    const first = await service.handleTurn({
      transcript: '这是什么',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(first.answer.evidenceAvailable).toBe(true)

    const followUp = await service.handleTurn({
      transcript: '为什么你觉得这是杯子？',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: first.memory,
    })

    expect(followUp.answer.source).toBe('memory')
    expect(followUp.answer.evidenceAvailable).toBe(true)
    expect(followUp.answer.regions.length).toBeGreaterThan(0)
    expect(followUp.answer.explanation).toBeTruthy()
  })

  it('highlights apple region and speaks feature-based reasoning', async () => {
    const service = new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({
        objectCandidates: [{ label: 'apple', confidence: 0.91, region: appleRegion }],
        gestures: [],
      }),
    })

    const first = await service.handleTurn({
      transcript: '这是什么',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    const followUp = await service.handleTurn({
      transcript: '为什么你觉得这是苹果？',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: first.memory,
    })

    expect(followUp.answer.evidenceAvailable).toBe(true)
    expect(followUp.answer.regions[0]).toMatchObject({ label: 'apple' })
    expect(buildSpeakableAnswerText(followUp.answer)).toContain('apple')
    expect(createActiveVisualEvidence(followUp.answer, Date.now())?.regions[0]?.label).toBe('apple')
  })

  it('returns uncertainty when why follow-up lacks evidence', () => {
    const answer = buildWhyFollowUpAnswer('为什么你觉得这是苹果？', emptyConversationMemory(), 'zh')
    expect(answer?.answer).toBe(uncertaintyAnswer('zh'))
    expect(answer?.evidenceAvailable).toBe(false)
  })
})

describe('MockCloudVisualLanguageProvider evidence normalization', () => {
  it('preserves region coordinates and bundled explanation', async () => {
    const provider = new MockCloudVisualLanguageProvider()
    const answer = await provider.answerVisualQuestion({
      transcript: 'what is this',
      frame,
      language: 'zh',
      memory: emptyConversationMemory(),
      localVision: {
        sceneCandidates: [],
        objectCandidates: [
          {
            label: 'apple',
            confidence: 0.82,
            region: appleRegion,
          },
        ],
        gestures: [],
        analyzedAt: 1,
        shouldUseCloud: true,
      },
    })

    expect(answer.evidenceAvailable).toBe(true)
    expect(answer.regions[0]).toMatchObject({ label: 'apple' })
    expect(answer.explanation).toContain('apple')
  })

  it('normalizes provider answers without inventing regions', () => {
    const normalized = normalizeProviderVisualAnswer(
      {
        kind: 'general',
        answer: 'Processed.',
        source: 'cloud',
        referencedEntities: [],
        regions: [{ x: 9, y: 9, width: 9, height: 9 }],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      'en',
    )

    expect(normalized.evidenceAvailable).toBe(false)
    expect(normalized.regions).toEqual([])
  })
})

describe('conversation memory evidence retention', () => {
  it('stores explanation and evidence availability from visual answers', () => {
    const memory = updateConversationMemory(
      emptyConversationMemory(),
      {
        kind: 'object',
        answer: '这是 apple。',
        explanation: '因为红圆形状和叶柄。',
        source: 'local',
        confidence: 0.9,
        referencedEntities: [{ label: 'apple', confidence: 0.9, region: appleRegion }],
        regions: [appleRegion],
        evidenceAvailable: true,
        requiresSpeech: true,
      },
      100,
    )

    expect(memory.entries[0]?.explanation).toContain('红圆形状')
    expect(memory.entries[0]?.evidenceAvailable).toBe(true)
    expect(memory.entries[0]?.region).toEqual(appleRegion)
  })
})
