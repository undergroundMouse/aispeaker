import { describe, expect, it } from 'vitest'
import {
  INTERRUPT_FIXTURE,
  QUIET_ENVIRONMENT_FIXTURE,
  computeInterruptSuccessRate,
  computeLatencyPercentile,
  computeWordAccuracy,
} from './realtimeQuality'

describe('realtimeQuality evaluation', () => {
  it('passes quiet-environment word accuracy above 95%', () => {
    const accuracy = computeWordAccuracy(QUIET_ENVIRONMENT_FIXTURE)
    expect(accuracy).toBeGreaterThan(0.95)
  })

  it('passes interrupt success rate above 90%', () => {
    const results = INTERRUPT_FIXTURE.map((fixture) => ({
      expectedInterrupt: fixture.expectedInterrupt,
      actualInterrupt: fixture.userSpeechRms >= 0.04,
    }))
    expect(computeInterruptSuccessRate(results)).toBeGreaterThan(0.9)
  })

  it('computes p95 latency below 3s budget on harness samples', () => {
    const samples = [1200, 1800, 2100, 2400, 2600, 2900]
    expect(computeLatencyPercentile(samples, 95)).toBeLessThan(3000)
  })
})
