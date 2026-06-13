import { describe, expect, it } from 'vitest'
import { getWatchOnlySamplingMode, WATCH_ONLY_INACTIVITY_MS } from './watchOnly'

describe('watchOnly', () => {
  it('uses normal sampling when watch-only mode is disabled', () => {
    expect(
      getWatchOnlySamplingMode({
        enabled: false,
        lastDialogueAt: null,
        now: 20_000,
      }),
    ).toBe('normal')
  })

  it('reduces sampling when watch-only mode has no dialogue activity', () => {
    expect(
      getWatchOnlySamplingMode({
        enabled: true,
        lastDialogueAt: null,
        now: 20_000,
      }),
    ).toBe('reduced')
  })

  it('reduces sampling after 10 seconds of dialogue inactivity', () => {
    expect(
      getWatchOnlySamplingMode({
        enabled: true,
        lastDialogueAt: 1_000,
        now: 1_000 + WATCH_ONLY_INACTIVITY_MS,
      }),
    ).toBe('reduced')
  })

  it('restores normal sampling while dialogue is active', () => {
    expect(
      getWatchOnlySamplingMode({
        enabled: true,
        lastDialogueAt: 10_000,
        now: 15_000,
      }),
    ).toBe('normal')
  })
})
