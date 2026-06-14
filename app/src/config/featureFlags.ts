export interface RealtimeFeatureFlags {
  realtimeSessionMode: boolean
  fullDuplexEnabled: boolean
  visionLevel3Enabled: boolean
  hybridOmniBuildEnabled: boolean
  hybridOmniDialogue: boolean
  omniPureDialogue: boolean
  omniVlCorrectionMode: VlCorrectionMode
}

export type VlCorrectionMode = 'ui-only' | 'spoken'

export function isBuildFlagEnabled(
  env: Record<string, string | undefined>,
  key: string,
  defaultEnabled = true,
): boolean {
  const value = env[key]?.trim().toLowerCase()
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return defaultEnabled
}

export function resolveHybridOmniDialogue(buildEnabled: boolean, userEnabled: boolean): boolean {
  return buildEnabled && userEnabled
}

export function readRealtimeFeatureFlags(
  env: Record<string, string | undefined> = import.meta.env,
  hybridOmniUserEnabled = true,
  omniPureUserEnabled = true,
): RealtimeFeatureFlags {
  const correctionMode = env.VITE_OMNI_VL_CORRECTION_MODE?.trim()
  const hybridDefaultEnabled = env.MODE !== 'test'
  const hybridOmniBuildEnabled = isBuildFlagEnabled(env, 'VITE_HYBRID_OMNI_DIALOGUE', hybridDefaultEnabled)
  const hybridOmniDialogue = resolveHybridOmniDialogue(hybridOmniBuildEnabled, hybridOmniUserEnabled)

  return {
    realtimeSessionMode: env.VITE_REALTIME_SESSION_MODE === 'true',
    fullDuplexEnabled: env.VITE_FULL_DUPLEX_ENABLED === 'true',
    visionLevel3Enabled: isBuildFlagEnabled(env, 'VITE_VISION_LEVEL3_ENABLED', true),
    hybridOmniBuildEnabled,
    hybridOmniDialogue,
    omniPureDialogue: hybridOmniDialogue && omniPureUserEnabled,
    omniVlCorrectionMode: correctionMode === 'spoken' ? 'spoken' : 'ui-only',
  }
}
