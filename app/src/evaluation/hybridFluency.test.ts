import { describe, expect, it } from 'vitest'
import {
  HYBRID_BARGE_IN_FIXTURE,
  HYBRID_FIRST_AUDIO_FIXTURE_MS,
  HYBRID_OBJECT_ROUTING_FIXTURE,
  HYBRID_SOAK_CI_WINDOW_MS,
  evaluateHybridBargeInSuccess,
  evaluateHybridFirstAudioP95,
  evaluateHybridSoakStability,
} from './hybridFluency'
import { resolveHybridRoute } from '../routing/adaptiveEdgeCloudRouter'

describe('hybridFluency evaluation', () => {
  it('passes hybrid first-audio p95 budget', () => {
    const result = evaluateHybridFirstAudioP95(HYBRID_FIRST_AUDIO_FIXTURE_MS)
    expect(result.pass).toBe(true)
    expect(result.p95Ms).toBeLessThan(800)
  })

  it('passes hybrid barge-in fixture above 90%', () => {
    const results = HYBRID_BARGE_IN_FIXTURE.map((fixture) => ({
      expectedInterrupt: fixture.expectedInterrupt,
      actualInterrupt: fixture.assistantSpeaking && fixture.userSpeechDetected,
    }))
    expect(evaluateHybridBargeInSuccess(results)).toBeGreaterThan(0.9)
  })

  it('passes shortened soak stability window for CI', () => {
    expect(HYBRID_SOAK_CI_WINDOW_MS).toBeLessThan(30_000)
    expect(evaluateHybridSoakStability([64 * 1024 * 1024, 65 * 1024 * 1024, 66 * 1024 * 1024])).toBe(true)
  })

  it('routes hybrid object fixtures to expected tiers', () => {
    for (const fixture of HYBRID_OBJECT_ROUTING_FIXTURE) {
      const decision = resolveHybridRoute({
        transcript: fixture.transcript,
        shouldUseCloud: fixture.shouldUseCloud ?? false,
        localVision: {
          sceneCandidates: [],
          objectCandidates: [{ label: 'cup', confidence: 0.92 }],
          gestures: [],
          analyzedAt: Date.now(),
          shouldUseCloud: fixture.shouldUseCloud ?? false,
        },
        networkState: 'online',
        dailyBudgetRemaining: 1,
        dailyBudgetCap: 10,
        privacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: true },
        dialogueActive: true,
      })
      expect(decision.tier).toBe(fixture.expectTier)
    }
  })
})
