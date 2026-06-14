import { describe, expect, it } from 'vitest'
import {
  OMNI_RECOVERABLE_FAILURE_THRESHOLD,
  resolveInitialHybridVoicePath,
  resolveNextHybridVoicePath,
  shouldStartLegacySession,
  shouldStartOmniSession,
} from './hybridDialogueFallback'

describe('hybridDialogueFallback', () => {
  it('starts on omni when hybrid is enabled', () => {
    expect(resolveInitialHybridVoicePath(true)).toBe('omni')
  })

  it('falls back to legacy session after repeated omni failures', () => {
    const next = resolveNextHybridVoicePath('omni', {
      type: 'omni-error',
      recoverable: true,
      failureCount: OMNI_RECOVERABLE_FAILURE_THRESHOLD,
    })
    expect(next).toBe('legacy-session')
  })

  it('stays on omni in pure mode after repeated failures', () => {
    const next = resolveNextHybridVoicePath(
      'omni',
      {
        type: 'omni-error',
        recoverable: true,
        failureCount: OMNI_RECOVERABLE_FAILURE_THRESHOLD,
      },
      { omniPureMode: true },
    )
    expect(next).toBe('omni')
  })

  it('falls back to push-to-talk after legacy failure', () => {
    expect(resolveNextHybridVoicePath('legacy-session', { type: 'legacy-error' })).toBe('push-to-talk')
  })

  it('routes wake word path to omni when enabled', () => {
    expect(shouldStartOmniSession(true, 'omni')).toBe(true)
    expect(shouldStartLegacySession(true, true, 'legacy-session')).toBe(true)
  })
})
