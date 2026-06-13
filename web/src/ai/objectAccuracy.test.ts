import { describe, expect, it } from 'vitest'
import {
  commonObjectEvaluationFixture,
  evaluateObjectAccuracy,
  commonObjectAccuracyThreshold,
} from './objectAccuracy'

describe('objectAccuracy', () => {
  it('passes the configured common-object accuracy threshold', () => {
    const result = evaluateObjectAccuracy(commonObjectEvaluationFixture)

    expect(result.accuracy).toBeGreaterThanOrEqual(commonObjectAccuracyThreshold)
    expect(result.passed).toBe(true)
  })
})
