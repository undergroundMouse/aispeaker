import type { FramePolicy, RouteTier } from '@ai/shared'
import type { LocalVisionSignals, MediaPrivacyConsent, NetworkState } from '../types'
import { isCloudMediaTransmissionAuthorized } from '../media/mediaPrivacy'
import { isVisualQuestion } from '../ai/localVision'

export type HybridRouteTier = 'omni-direct' | 'local-hints' | 'vl-verify' | 'local-only'

export interface AdaptiveRouteInput {
  shouldUseCloud: boolean
  localVision: LocalVisionSignals
  networkState: NetworkState
  dailyBudgetRemaining: number | null
  dailyBudgetCap: number | null
  privacy: MediaPrivacyConsent
  dialogueActive: boolean
}

export interface AdaptiveRouteDecision {
  tier: RouteTier
  framePolicy: FramePolicy
  modelTier: 'minimal' | 'standard' | 'full'
  allowCloud: boolean
  reason: string
}

export interface HybridRouteDecision {
  tier: HybridRouteTier
  framePolicy: FramePolicy
  allowCloud: boolean
  reason: string
}

export interface HybridRouteInput extends AdaptiveRouteInput {
  transcript: string
}

export function resolveHybridRoute(input: HybridRouteInput): HybridRouteDecision {
  const base = resolveAdaptiveRoute(input)
  const normalized = input.transcript.trim().toLocaleLowerCase()
  const visualQuestion = isVisualQuestion(normalized)

  if (!visualQuestion) {
    return {
      tier: 'omni-direct',
      framePolicy: base.framePolicy,
      allowCloud: false,
      reason: 'non-visual-utterance',
    }
  }

  if (base.tier === 'local-only') {
    return {
      tier: 'local-only',
      framePolicy: base.framePolicy,
      allowCloud: false,
      reason: base.reason,
    }
  }

  if (!input.shouldUseCloud) {
    return {
      tier: 'local-hints',
      framePolicy: base.framePolicy,
      allowCloud: false,
      reason: 'local-confidence',
    }
  }

  return {
    tier: 'vl-verify',
    framePolicy: base.framePolicy,
    allowCloud: base.allowCloud,
    reason: 'visual-verification-required',
  }
}

export function framePolicyToOmniKeyFrameIntervalMs(policy: FramePolicy): number {
  switch (policy) {
    case 'minimal':
      return 5000
    case 'reduced':
      return 2000
    case 'active':
      return 500
    default:
      return 1000
  }
}

export function resolveAdaptiveRoute(input: AdaptiveRouteInput): AdaptiveRouteDecision {
  if (input.networkState === 'offline') {
    return {
      tier: 'local-only',
      framePolicy: 'reduced',
      modelTier: 'minimal',
      allowCloud: false,
      reason: 'offline',
    }
  }

  if (!isCloudMediaTransmissionAuthorized(input.privacy)) {
    return {
      tier: 'local-only',
      framePolicy: input.dialogueActive ? 'normal' : 'reduced',
      modelTier: 'standard',
      allowCloud: false,
      reason: 'privacy-denied',
    }
  }

  const budgetPressure =
    input.dailyBudgetCap !== null &&
    input.dailyBudgetRemaining !== null &&
    input.dailyBudgetRemaining < input.dailyBudgetCap * 0.1

  if (budgetPressure) {
    return {
      tier: 'degraded',
      framePolicy: 'minimal',
      modelTier: 'minimal',
      allowCloud: input.shouldUseCloud,
      reason: 'budget-pressure',
    }
  }

  if (input.networkState === 'weak') {
    return {
      tier: 'edge-first',
      framePolicy: 'reduced',
      modelTier: 'standard',
      allowCloud: input.shouldUseCloud,
      reason: 'weak-network',
    }
  }

  if (!input.shouldUseCloud) {
    return {
      tier: 'edge-first',
      framePolicy: input.dialogueActive ? 'active' : 'normal',
      modelTier: 'standard',
      allowCloud: false,
      reason: 'local-confidence',
    }
  }

  return {
    tier: 'cloud-full',
    framePolicy: input.dialogueActive ? 'active' : 'normal',
    modelTier: 'full',
    allowCloud: true,
    reason: 'cloud-required',
  }
}

export function framePolicyToSamplingInterval(policy: FramePolicy): { normal: number; reduced: number } {
  switch (policy) {
    case 'minimal':
      return { normal: 5000, reduced: 10000 }
    case 'reduced':
      return { normal: 2000, reduced: 5000 }
    case 'active':
      return { normal: 200, reduced: 1000 }
    default:
      return { normal: 1000, reduced: 5000 }
  }
}
