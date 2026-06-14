import { describe, expect, it } from 'vitest'
import { resolveAdaptiveRoute } from './adaptiveEdgeCloudRouter'

describe('adaptiveEdgeCloudRouter', () => {
  it('routes local-only when offline', () => {
    const decision = resolveAdaptiveRoute({
      shouldUseCloud: true,
      localVision: {
        sceneCandidates: [],
        objectCandidates: [],
        gestures: [],
        analyzedAt: Date.now(),
        shouldUseCloud: true,
      },
      networkState: 'offline',
      dailyBudgetRemaining: 1,
      dailyBudgetCap: 10,
      privacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: true },
      dialogueActive: false,
    })
    expect(decision.tier).toBe('local-only')
    expect(decision.allowCloud).toBe(false)
  })

  it('degrades under budget pressure', () => {
    const decision = resolveAdaptiveRoute({
      shouldUseCloud: true,
      localVision: {
        sceneCandidates: [],
        objectCandidates: [],
        gestures: [],
        analyzedAt: Date.now(),
        shouldUseCloud: true,
      },
      networkState: 'online',
      dailyBudgetRemaining: 0.005,
      dailyBudgetCap: 1,
      privacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: true },
      dialogueActive: true,
    })
    expect(decision.tier).toBe('degraded')
    expect(decision.framePolicy).toBe('minimal')
  })
})
