import { describe, expect, it } from 'vitest'
import { deriveNetworkState, shouldBlockCloudRequest } from './networkState'

describe('networkState', () => {
  it('returns offline when browser connectivity is unavailable', () => {
    expect(deriveNetworkState({ online: false })).toBe('offline')
  })

  it('returns weak after a recent cloud request failure', () => {
    expect(
      deriveNetworkState({
        online: true,
        lastCloudRequestFailedAt: 1_000,
        now: 10_000,
        weakWindowMs: 30_000,
      }),
    ).toBe('weak')
  })

  it('returns online when there is no recent cloud failure', () => {
    expect(
      deriveNetworkState({
        online: true,
        lastCloudRequestFailedAt: 1_000,
        now: 40_001,
        weakWindowMs: 30_000,
      }),
    ).toBe('online')
  })

  it('blocks cloud requests for weak or offline states', () => {
    expect(shouldBlockCloudRequest('online')).toBe(false)
    expect(shouldBlockCloudRequest('weak')).toBe(true)
    expect(shouldBlockCloudRequest('offline')).toBe(true)
  })
})
