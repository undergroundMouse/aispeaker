// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAssistPresentation } from './useAssistPresentation'

describe('useAssistPresentation', () => {
  it('keeps proactive prompt text out of caption turns', () => {
    const { result } = renderHook(() =>
      useAssistPresentation({
        dialogueSegments: [],
        feedback: '快递员似乎在门口',
        lastVisualAnswer: null,
        lastDialogueEvent: null,
        lastProactivePrompt: {
          id: 'prompt-1',
          ruleId: 'rule-1',
          promptKey: 'courier',
          text: '快递员似乎在门口',
          confidence: 0.95,
          severity: 'info',
          priority: 'normal',
          source: 'local-rules',
          labels: ['courier'],
          regions: [],
          createdAt: Date.now(),
        },
        isPushToTalkActive: false,
        speechState: {
          status: 'speaking',
          provider: 'mock',
          currentTurnId: 'prompt-1',
          fallbackUsed: false,
          errorMessage: null,
          cancellationReason: null,
        },
        language: 'zh',
      }),
    )

    expect(result.current.captionTurns).toHaveLength(0)
    expect(result.current.proactiveBanner.visible).toBe(true)
  })

  it('keeps user transcript visible when assistant feedback advances before segments finalize', () => {
    const { result } = renderHook(() =>
      useAssistPresentation({
        dialogueSegments: [{ turnId: 'turn-1', text: '正在分析语音和画面...', isFinal: false, receivedAt: 1 }],
        feedback: '云端 API 密钥无效或未填写。请在阿里云百炼获取密钥（sk- 开头），写入 server/.env 的 QWEN_API_KEY 后重启后端。',
        lastVisualAnswer: {
          kind: 'network-error',
          answer: '云端 API 密钥无效或未填写。请在阿里云百炼获取密钥（sk- 开头），写入 server/.env 的 QWEN_API_KEY 后重启后端。',
          source: 'system',
          referencedEntities: [],
          regions: [],
          evidenceAvailable: false,
          requiresSpeech: true,
        },
        lastDialogueEvent: {
          trigger: 'push-to-talk',
          transcript: '这是什么',
          startedAt: 1,
        },
        lastProactivePrompt: null,
        isPushToTalkActive: false,
        speechState: {
          status: 'idle',
          provider: null,
          currentTurnId: null,
          fallbackUsed: false,
          errorMessage: null,
          cancellationReason: null,
        },
        language: 'zh',
      }),
    )

    expect(result.current.captionTurns[0]?.userText).toBe('这是什么')
    expect(result.current.captionTurns[0]?.assistantText).toContain('API 密钥无效')
  })
})
