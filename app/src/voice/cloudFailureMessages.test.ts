import { describe, expect, it } from 'vitest'
import {
  getBackendUnreachableMessage,
  getCloudMediaConsentMessage,
  getOfflineCloudMessage,
  getQwenNotConfiguredMessage,
  resolveCloudFailureMessage,
  resolveFetchFailureMessage,
} from './cloudFailureMessages'

describe('cloudFailureMessages', () => {
  it('maps provider consent failures to a settings hint', () => {
    expect(
      resolveCloudFailureMessage('zh', 'provider-error', 'Cloud media transmission is not authorized.'),
    ).toBe(getCloudMediaConsentMessage('zh'))
  })

  it('maps missing qwen configuration to a server setup hint', () => {
    expect(
      resolveCloudFailureMessage('en', 'provider-error', 'Qwen provider is not configured on the server.'),
    ).toBe(getQwenNotConfiguredMessage('en'))
  })

  it('maps fetch failures to backend unreachable guidance', () => {
    expect(resolveFetchFailureMessage('zh', new TypeError('Failed to fetch'))).toBe(
      getBackendUnreachableMessage('zh'),
    )
  })

  it('maps invalid cloud api keys to a setup hint', () => {
    expect(resolveCloudFailureMessage('zh', 'provider-error', 'invalid token')).toContain('百炼')
  })

  it('maps offline state to an offline-specific message', () => {
    expect(getOfflineCloudMessage('zh')).toContain('离线')
  })
})
