import { describe, expect, it } from 'vitest'
import { resolveHybridRoute } from './adaptiveEdgeCloudRouter'

describe('resolveHybridRoute', () => {
  const baseInput = {
    shouldUseCloud: true,
    localVision: {
      sceneCandidates: [],
      objectCandidates: [{ label: 'cup', confidence: 0.92 }],
      gestures: [],
      analyzedAt: Date.now(),
      shouldUseCloud: false,
    },
    networkState: 'online' as const,
    dailyBudgetRemaining: 1,
    dailyBudgetCap: 10,
    privacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: true },
    dialogueActive: true,
  }

  it('selects omni-direct for non-visual utterances', () => {
    const decision = resolveHybridRoute({
      ...baseInput,
      transcript: '你好',
    })
    expect(decision.tier).toBe('omni-direct')
  })

  it('selects local-hints when local confidence is sufficient', () => {
    const decision = resolveHybridRoute({
      ...baseInput,
      shouldUseCloud: false,
      transcript: '这是什么',
    })
    expect(decision.tier).toBe('local-hints')
  })

  it('selects vl-verify when cloud is required', () => {
    const decision = resolveHybridRoute({
      ...baseInput,
      shouldUseCloud: true,
      localVision: {
        ...baseInput.localVision,
        shouldUseCloud: true,
      },
      transcript: '这是什么',
    })
    expect(decision.tier).toBe('vl-verify')
  })
})
