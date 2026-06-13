import { describe, expect, it } from 'vitest'
import { buildSpeakableAnswerText, createActiveVisualEvidence } from '../ai/visualEvidence'
import type { VisualAnswer } from '../types'

describe('visual evidence speech sequencing', () => {
  it('speaks the answer and explanation together when evidence is available', () => {
    const answer: VisualAnswer = {
      kind: 'object',
      answer: '这是 apple。',
      explanation: '因为红圆形状和叶柄。',
      source: 'local',
      referencedEntities: [{ label: 'apple', confidence: 0.9 }],
      regions: [{ x: 0.3, y: 0.25, width: 0.2, height: 0.25, label: 'apple' }],
      evidenceAvailable: true,
      requiresSpeech: true,
    }

    expect(buildSpeakableAnswerText(answer)).toBe('这是 apple。 因为红圆形状和叶柄。')
  })

  it('activates overlay state only when evidence regions exist', () => {
    const withEvidence: VisualAnswer = {
      kind: 'object',
      answer: '这是 apple。',
      explanation: '因为红圆形状和叶柄。',
      source: 'memory',
      referencedEntities: [{ label: 'apple', confidence: 0.9 }],
      regions: [{ x: 0.3, y: 0.25, width: 0.2, height: 0.25, label: 'apple' }],
      evidenceAvailable: true,
      requiresSpeech: true,
    }

    const withoutEvidence: VisualAnswer = {
      kind: 'clarification',
      answer: '我不确定原因。',
      source: 'memory',
      referencedEntities: [],
      regions: [],
      evidenceAvailable: false,
      requiresSpeech: true,
    }

    expect(createActiveVisualEvidence(withEvidence, 100)).not.toBeNull()
    expect(createActiveVisualEvidence(withoutEvidence, 100)).toBeNull()
  })
})
