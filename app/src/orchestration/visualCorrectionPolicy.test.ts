import { describe, expect, it } from 'vitest'
import {
  buildVisualCorrectionInstruction,
  shouldSpeakVisualCorrection,
  visualAnswersMateriallyDiffer,
} from './visualCorrectionPolicy'

describe('visualCorrectionPolicy', () => {
  it('defaults to ui-only correction mode', () => {
    expect(shouldSpeakVisualCorrection('ui-only')).toBe(false)
    expect(shouldSpeakVisualCorrection('spoken')).toBe(true)
  })

  it('detects material visual answer differences', () => {
    expect(
      visualAnswersMateriallyDiffer(
        {
          kind: 'object',
          answer: '这是手机。',
          source: 'cloud',
          referencedEntities: [],
          regions: [],
          evidenceAvailable: true,
          requiresSpeech: true,
        },
        '这是一个杯子。',
      ),
    ).toBe(true)
  })

  it('builds correction instruction text', () => {
    expect(
      buildVisualCorrectionInstruction(
        {
          kind: 'object',
          answer: '这是手机。',
          source: 'cloud',
          referencedEntities: [],
          regions: [],
          evidenceAvailable: true,
          requiresSpeech: true,
        },
        'zh',
      ),
    ).toContain('手机')
  })
})
