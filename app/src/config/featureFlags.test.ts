import { describe, expect, it } from 'vitest'
import { isBuildFlagEnabled, readRealtimeFeatureFlags, resolveHybridOmniDialogue } from './featureFlags'

describe('featureFlags', () => {
  it('enables hybrid omni by default when env is unset', () => {
    const flags = readRealtimeFeatureFlags({ MODE: 'development' }, true, true)
    expect(flags.hybridOmniBuildEnabled).toBe(true)
    expect(flags.hybridOmniDialogue).toBe(true)
    expect(flags.visionLevel3Enabled).toBe(true)
  })

  it('disables hybrid omni by default in test mode', () => {
    const flags = readRealtimeFeatureFlags({ MODE: 'test' }, true, true)
    expect(flags.hybridOmniDialogue).toBe(false)
  })

  it('allows build-time disable via env', () => {
    const flags = readRealtimeFeatureFlags({ VITE_HYBRID_OMNI_DIALOGUE: 'false' }, true)
    expect(flags.hybridOmniDialogue).toBe(false)
  })

  it('respects user preference when build flag allows hybrid', () => {
    expect(resolveHybridOmniDialogue(true, false)).toBe(false)
    expect(readRealtimeFeatureFlags({ MODE: 'development' }, false, true).hybridOmniDialogue).toBe(false)
  })

  it('enables pure omni only when hybrid is active', () => {
    const flags = readRealtimeFeatureFlags({ MODE: 'development' }, true, true)
    expect(flags.omniPureDialogue).toBe(true)

    const hybridOff = readRealtimeFeatureFlags({ MODE: 'development' }, false, true)
    expect(hybridOff.omniPureDialogue).toBe(false)
  })

  it('parses explicit env overrides', () => {
    expect(isBuildFlagEnabled({ VITE_HYBRID_OMNI_DIALOGUE: 'true' }, 'VITE_HYBRID_OMNI_DIALOGUE')).toBe(true)
    expect(isBuildFlagEnabled({ VITE_HYBRID_OMNI_DIALOGUE: 'false' }, 'VITE_HYBRID_OMNI_DIALOGUE')).toBe(false)
  })
})
