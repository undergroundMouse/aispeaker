import { describe, expect, it, vi } from 'vitest'
import type { CloudVisualQuestionRequest } from '../types'
import { emptyConversationMemory } from './conversationMemory'
import { readQwenCloudProviderConfig } from './cloudProviderConfig'
import { createCloudVisualLanguageProvider } from './createCloudVisualLanguageProvider'
import { buildQwenVisualPrompt, QwenCloudVisualLanguageProvider } from './qwenCloudVisualLanguage'

const frame: CloudVisualQuestionRequest['frame'] = {
  blob: new Blob(['frame'], { type: 'image/jpeg' }),
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
      objectCandidates: [
        {
          label: '杯子',
          confidence: 0.71,
          region: { x: 0.1, y: 0.2, width: 0.3, height: 0.4, label: '杯子' },
        },
      ],
      gestures: [],
      analyzedAt: 1,
      shouldUseCloud: true,
    },
  }
}

describe('readQwenCloudProviderConfig', () => {
  it('returns null when API key is missing', () => {
    expect(readQwenCloudProviderConfig({})).toBeNull()
  })

  it('reads DashScope defaults from env', () => {
    expect(
      readQwenCloudProviderConfig({
        VITE_QWEN_API_KEY: 'sk-test',
      }),
    ).toEqual({
      apiKey: 'sk-test',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-vl-plus',
    })
  })
})

describe('createCloudVisualLanguageProvider', () => {
  it('falls back to mock provider without env key', () => {
    expect(createCloudVisualLanguageProvider({}).kind).toBe('mock')
  })

  it('creates qwen provider when API key is configured without backend', () => {
    expect(
      createCloudVisualLanguageProvider({
        VITE_QWEN_API_KEY: 'sk-test',
        VITE_CLOUD_AUTHORITY_MODE: 'client',
      }).kind,
    ).toBe('qwen')
  })

  it('creates backend provider when backend URL is configured', () => {
    expect(
      createCloudVisualLanguageProvider({
        VITE_BACKEND_BASE_URL: 'http://localhost:3000',
        VITE_CLOUD_AUTHORITY_MODE: 'server',
      }).kind,
    ).toBe('backend')
  })
})

describe('QwenCloudVisualLanguageProvider', () => {
  it('builds a structured JSON prompt with local vision hints', () => {
    const prompt = buildQwenVisualPrompt(createRequest())

    expect(prompt).toContain('Return ONLY valid JSON')
    expect(prompt).toContain('杯子')
    expect(prompt).toContain('这是什么')
  })

  it('parses structured cloud responses with regions', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                kind: 'object',
                answer: '这是一个杯子。',
                explanation: '因为画面中央有杯状容器。',
                confidence: 0.91,
                label: '杯子',
                regions: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.4, label: '杯子' }],
              }),
              reasoning_content: '杯口圆形且带把手。',
            },
          },
        ],
        usage: { total_tokens: 321 },
      }),
    })

    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      readAsDataURL() {
        this.onload?.()
      }

      get result() {
        return 'data:image/jpeg;base64,ZmFrZQ=='
      }
    }

    globalThis.FileReader = MockFileReader as unknown as typeof FileReader

    try {
      const provider = new QwenCloudVisualLanguageProvider({
        apiKey: 'sk-test',
        baseUrl: 'https://llm.wavespeed.ai/v1',
        model: 'qwen/qwen3-vl-8b-thinking',
        fetchImpl,
      })

      const answer = await provider.answerVisualQuestion(createRequest())

      expect(fetchImpl).toHaveBeenCalledOnce()
      expect(answer.source).toBe('cloud')
      expect(answer.kind).toBe('object')
      expect(answer.answer).toBe('这是一个杯子。')
      expect(answer.evidenceAvailable).toBe(true)
      expect(answer.regions[0]).toMatchObject({ label: '杯子' })
      expect(provider.getLastUsageTokens()).toBe(321)
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})
