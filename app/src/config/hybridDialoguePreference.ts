export const HYBRID_DIALOGUE_PREFERENCE_STORAGE_KEY = 'hybrid-omni-dialogue-enabled'
export const OMNI_PURE_DIALOGUE_PREFERENCE_STORAGE_KEY = 'omni-pure-dialogue-enabled'

export function defaultHybridDialoguePreference(): boolean {
  return true
}

export function defaultOmniPureDialoguePreference(): boolean {
  return true
}

export function loadHybridDialoguePreference(storage: Storage = localStorage): boolean {
  try {
    const raw = storage.getItem(HYBRID_DIALOGUE_PREFERENCE_STORAGE_KEY)
    if (raw === null) {
      return defaultHybridDialoguePreference()
    }

    return raw === 'true'
  } catch {
    return defaultHybridDialoguePreference()
  }
}

export function loadOmniPureDialoguePreference(storage: Storage = localStorage): boolean {
  try {
    const raw = storage.getItem(OMNI_PURE_DIALOGUE_PREFERENCE_STORAGE_KEY)
    if (raw === null) {
      return defaultOmniPureDialoguePreference()
    }

    return raw === 'true'
  } catch {
    return defaultOmniPureDialoguePreference()
  }
}

export function saveHybridDialoguePreference(enabled: boolean, storage: Storage = localStorage): boolean {
  storage.setItem(HYBRID_DIALOGUE_PREFERENCE_STORAGE_KEY, enabled ? 'true' : 'false')
  return enabled
}

export function saveOmniPureDialoguePreference(enabled: boolean, storage: Storage = localStorage): boolean {
  storage.setItem(OMNI_PURE_DIALOGUE_PREFERENCE_STORAGE_KEY, enabled ? 'true' : 'false')
  return enabled
}
