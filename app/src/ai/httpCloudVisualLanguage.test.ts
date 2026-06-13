import { describe, expect, it, vi } from 'vitest'
import type { CloudVisualQuestionRequest } from '../types'
import { emptyConversationMemory } from './conversationMemory'
import { HttpCloudVisualLanguageProvider } from './httpCloudVisualLanguage'

const frame: CloudVisualQuestionRequest['frame'] = {
  blob: new Blob(['frame'], { type: 'image/jpeg' }),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

function createRequest(): CloudVisualQuestionRequest {
  return {
    transcript: '详细说明这个物体',
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

describe('HttpCloudVisualLanguageProvider', () => {
  it('maps budget-exceeded backend failures to budget message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: false,
        reason: 'budget-exceeded',
        message: '今日云端预算已用尽',
        telemetry: { estimatedTokens: 10, estimatedCost: 0.01 },
      }),
    })

    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      onload: (() => void) | null = null
      readAsDataURL() {
        this.onload?.()
      }
      get result() {
        return 'data:image/jpeg;base64,ZmFrZQ=='
      }
    }
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader

    try {
      const provider = new HttpCloudVisualLanguageProvider(
        {
          baseUrl: 'http://localhost:3000',
          deviceApiToken: 'dev-device-token',
          adminApiToken: 'dev-admin-token',
        },
        () => ({
          conversationId: 'c1',
          consent: { cloudMediaTransmission: true, cloudMemoryAccess: false },
        }),
        fetchImpl,
      )

      const answer = await provider.answerVisualQuestion(createRequest())
      expect(answer.answer).toBe('今日云端预算已用尽')
      expect(fetchImpl).toHaveBeenCalledOnce()
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})
