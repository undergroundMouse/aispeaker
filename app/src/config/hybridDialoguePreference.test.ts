import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultHybridDialoguePreference,
  loadHybridDialoguePreference,
  loadOmniPureDialoguePreference,
  saveHybridDialoguePreference,
} from './hybridDialoguePreference'

describe('hybridDialoguePreference', () => {
  beforeEach(() => {
    const storage = {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null
      },
      setItem(key: string, value: string) {
        this.store[key] = value
      },
    }
    vi.stubGlobal('localStorage', storage)
  })

  it('defaults hybrid dialogue to enabled', () => {
    expect(defaultHybridDialoguePreference()).toBe(true)
    expect(loadHybridDialoguePreference()).toBe(true)
  })

  it('persists and reloads user preference', () => {
    saveHybridDialoguePreference(false)
    expect(loadHybridDialoguePreference()).toBe(false)

    saveHybridDialoguePreference(true)
    expect(loadHybridDialoguePreference()).toBe(true)
  })

  it('defaults pure omni preference to enabled', () => {
    expect(loadOmniPureDialoguePreference()).toBe(true)
  })
})
