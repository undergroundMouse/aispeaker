import type { MultimodalDialogueRequest } from '../types'

export const EDGE_CLOUD_BASELINE_FIXTURE_VERSION = 'v1'

export interface EdgeCloudBaselineFixture {
  id: string
  transcript: string
  hasFrame: boolean
  networkState: MultimodalDialogueRequest['networkState']
  expectsCloud: boolean
}

export const EDGE_CLOUD_BASELINE_FIXTURES: EdgeCloudBaselineFixture[] = [
  { id: 'local-object-zh', transcript: '这是什么', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'local-scene-zh', transcript: '我现在在哪类场景', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'local-gesture-en', transcript: 'hello', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'memory-follow-up-zh', transcript: '它在哪里', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'local-stop-zh', transcript: '停止', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'local-scene-en', transcript: 'what scene is this', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'local-object-en', transcript: 'what is this', hasFrame: true, networkState: 'online', expectsCloud: false },
  { id: 'complex-cloud-en', transcript: 'explain the unusual texture and material of this object', hasFrame: true, networkState: 'online', expectsCloud: true },
  { id: 'complex-cloud-zh', transcript: '详细说明这个物体的材质和用途', hasFrame: true, networkState: 'online', expectsCloud: true },
  { id: 'complex-cloud-scene', transcript: 'describe everything unusual in this scene in detail', hasFrame: true, networkState: 'online', expectsCloud: true },
]

export type CloudRoutingOutcome = 'local-short-circuit' | 'cloud-invoked'

export interface EdgeCloudMetricsSession {
  cloudInvocations: number
  localShortCircuits: number
  outcomes: CloudRoutingOutcome[]
}

export function createEdgeCloudMetricsSession(): EdgeCloudMetricsSession {
  return {
    cloudInvocations: 0,
    localShortCircuits: 0,
    outcomes: [],
  }
}

export function recordCloudRoutingOutcome(
  session: EdgeCloudMetricsSession,
  outcome: CloudRoutingOutcome,
): EdgeCloudMetricsSession {
  const next = {
    ...session,
    outcomes: [...session.outcomes, outcome],
  }

  if (outcome === 'cloud-invoked') {
    next.cloudInvocations += 1
  } else {
    next.localShortCircuits += 1
  }

  return next
}

export function computeCloudOnlyBaselineCount(fixtures = EDGE_CLOUD_BASELINE_FIXTURES): number {
  return fixtures.length
}

export function computeCloudReductionRatio(session: EdgeCloudMetricsSession, baselineCount?: number): number {
  const baseline = baselineCount ?? computeCloudOnlyBaselineCount()
  if (baseline === 0) {
    return 1
  }

  return 1 - session.cloudInvocations / baseline
}

export function meetsCloudReductionTarget(
  session: EdgeCloudMetricsSession,
  minimumRatio = 0.7,
  baselineCount?: number,
): boolean {
  return computeCloudReductionRatio(session, baselineCount) >= minimumRatio
}
