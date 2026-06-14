import { describe, expect, it } from 'vitest'
import { buildOmniRealtimeWebSocketUrl } from '../ai/backendClient'

describe('buildOmniRealtimeWebSocketUrl', () => {
  it('builds omni websocket url with device token', () => {
    const url = buildOmniRealtimeWebSocketUrl({
      baseUrl: 'http://localhost:3000',
      deviceApiToken: 'dev-device-token',
      adminApiToken: 'dev-admin-token',
    })

    expect(url).toBe('ws://localhost:3000/api/v1/realtime/omni?token=dev-device-token')
  })
})
