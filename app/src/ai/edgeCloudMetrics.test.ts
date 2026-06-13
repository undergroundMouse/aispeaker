import { describe, expect, it } from 'vitest'
import {
  EDGE_CLOUD_BASELINE_FIXTURES,
  computeCloudReductionRatio,
  createEdgeCloudMetricsSession,
  meetsCloudReductionTarget,
  recordCloudRoutingOutcome,
} from './edgeCloudMetrics'

describe('edgeCloudMetrics', () => {
  it('defines a versioned cloud-only baseline fixture set', () => {
    expect(EDGE_CLOUD_BASELINE_FIXTURES.length).toBeGreaterThan(0)
    expect(EDGE_CLOUD_BASELINE_FIXTURES.some((fixture) => fixture.expectsCloud)).toBe(true)
    expect(EDGE_CLOUD_BASELINE_FIXTURES.some((fixture) => !fixture.expectsCloud)).toBe(true)
  })

  it('measures cloud reduction against the baseline', () => {
    let session = createEdgeCloudMetricsSession()
    for (let index = 0; index < EDGE_CLOUD_BASELINE_FIXTURES.length; index += 1) {
      session = recordCloudRoutingOutcome(
        session,
        EDGE_CLOUD_BASELINE_FIXTURES[index]?.expectsCloud ? 'cloud-invoked' : 'local-short-circuit',
      )
    }

    expect(computeCloudReductionRatio(session)).toBeGreaterThanOrEqual(0.7)
    expect(meetsCloudReductionTarget(session)).toBe(true)
  })
})
