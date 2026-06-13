import { describe, expect, it } from 'vitest'
import { buildConversationEntries, detectSystemFailureVariant } from './conversationEntry'

describe('conversationEntry', () => {
  it('maps assistant answers with explanation meta', () => {
    const entries = buildConversationEntries({
      feedback: '这是一个杯子。',
      lastVisualAnswer: {
        kind: 'object',
        answer: '这是一个杯子。',
        explanation: '杯口有反光。',
        source: 'cloud',
        referencedEntities: [],
        regions: [],
        evidenceAvailable: true,
        requiresSpeech: true,
      },
      lastProactivePrompt: null,
      lastDialogueEvent: { trigger: 'push-to-talk', transcript: '这是什么', startedAt: 1 },
      language: 'zh',
    })

    expect(entries).toHaveLength(2)
    expect(entries[0]?.role).toBe('user')
    expect(entries[1]?.role).toBe('assistant')
    expect(entries[1]?.meta).toBe('杯口有反光。')
  })

  it('maps network failures to system network variant', () => {
    const entries = buildConversationEntries({
      feedback: '网络不佳，请重试',
      lastVisualAnswer: {
        kind: 'network-error',
        answer: '网络不佳，请重试',
        source: 'system',
        referencedEntities: [],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      lastProactivePrompt: null,
      lastDialogueEvent: null,
      language: 'zh',
    })

    expect(entries[0]?.role).toBe('system')
    expect(entries[0]?.systemVariant).toBe('network')
  })

  it('detects budget-specific messaging', () => {
    expect(detectSystemFailureVariant('今日云端预算已用尽', 'zh')).toBe('budget')
  })

  it('detects backend setup messaging', () => {
    expect(detectSystemFailureVariant('无法连接本地后端，请先运行 npm run dev:server。', 'zh')).toBe(
      'backend',
    )
  })
})
