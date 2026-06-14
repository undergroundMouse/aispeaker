import { describe, expect, it } from 'vitest'
import {
  extractLocalMemoryCandidates,
  parseExplicitMemoryIntent,
  shouldSkipDialogueMemoryPersistence,
} from './dialogueMemory'

describe('dialogueMemory', () => {
  it('extracts preference memories from explicit Chinese intent', () => {
    const candidates = extractLocalMemoryCandidates('我喜欢红色', 'zh')

    expect(candidates).toHaveLength(1)
    expect(candidates[0]?.type).toBe('preference')
    expect(candidates[0]?.summary).toContain('红色')
  })

  it('skips teaching phrases for local memory extraction', () => {
    expect(extractLocalMemoryCandidates('记住这个叫小红杯', 'zh')).toEqual([])
  })

  it('parses explicit Chinese memory requests into durable facts', () => {
    const memory = parseExplicitMemoryIntent('帮我记住钥匙在门口柜子', 'zh')

    expect(memory).toMatchObject({
      type: 'fact',
      value: '钥匙在门口柜子',
    })
    expect(memory?.summary).toContain('钥匙在门口柜子')
  })

  it('parses explicit English memory requests', () => {
    const memory = parseExplicitMemoryIntent('remember that my passport is in the drawer', 'en')

    expect(memory).toMatchObject({
      type: 'fact',
      value: 'my passport is in the drawer',
    })
  })

  it('keeps object teaching phrases out of explicit long-term memory', () => {
    expect(parseExplicitMemoryIntent('记住这个叫小红杯', 'zh')).toBeNull()
  })

  it('skips one-off object questions without durable memory signals', () => {
    expect(
      shouldSkipDialogueMemoryPersistence({
        transcript: '这是什么',
        answer: {
          kind: 'object',
          answer: '这是一个杯子。',
          source: 'local',
          referencedEntities: [],
          regions: [],
          evidenceAvailable: false,
          requiresSpeech: true,
        },
      }),
    ).toBe(true)
  })
})
