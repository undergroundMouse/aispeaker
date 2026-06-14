export type HybridVoicePath = 'omni' | 'legacy-session' | 'push-to-talk'

export const OMNI_RECOVERABLE_FAILURE_THRESHOLD = 3

export function resolveInitialHybridVoicePath(hybridOmniEnabled: boolean): HybridVoicePath {
  return hybridOmniEnabled ? 'omni' : 'push-to-talk'
}

export function resolveNextHybridVoicePath(
  current: HybridVoicePath,
  event:
    | { type: 'omni-error'; recoverable: boolean; failureCount: number }
    | { type: 'legacy-error' },
  options?: { omniPureMode?: boolean },
): HybridVoicePath {
  if (event.type === 'legacy-error') {
    return options?.omniPureMode ? 'omni' : 'push-to-talk'
  }

  if (current !== 'omni') {
    return current
  }

  if (options?.omniPureMode) {
    return 'omni'
  }

  if (!event.recoverable || event.failureCount >= OMNI_RECOVERABLE_FAILURE_THRESHOLD) {
    return 'legacy-session'
  }

  return 'omni'
}

export function shouldStartLegacySession(
  hybridOmniEnabled: boolean,
  legacySessionMode: boolean,
  voicePath: HybridVoicePath,
): boolean {
  if (voicePath === 'legacy-session') {
    return true
  }

  return legacySessionMode && !hybridOmniEnabled
}

export function shouldStartOmniSession(hybridOmniEnabled: boolean, voicePath: HybridVoicePath): boolean {
  return hybridOmniEnabled && voicePath === 'omni'
}

export function shouldUsePushToTalkFallback(voicePath: HybridVoicePath): boolean {
  return voicePath === 'push-to-talk'
}
