import type { SamplingMode } from './types'

export const WATCH_ONLY_INACTIVITY_MS = 10_000

export interface WatchOnlyState {
  enabled: boolean
  lastDialogueAt: number | null
  now: number
  inactivityMs?: number
}

export function getWatchOnlySamplingMode({
  enabled,
  lastDialogueAt,
  now,
  inactivityMs = WATCH_ONLY_INACTIVITY_MS,
}: WatchOnlyState): SamplingMode {
  if (!enabled) {
    return 'normal'
  }

  if (lastDialogueAt === null) {
    return 'reduced'
  }

  return now - lastDialogueAt >= inactivityMs ? 'reduced' : 'normal'
}
