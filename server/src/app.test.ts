import { describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './app.js'
import { loadServerConfig } from './config.js'
import { SqliteStore } from './db/store.js'

function createTestStore(): SqliteStore {
  const dir = mkdtempSync(join(tmpdir(), 'cp-app-test-'))
  return new SqliteStore(join(dir, 'state.json'))
}

describe('auth middleware', () => {
  it('rejects unauthorized device requests', async () => {
    const store = createTestStore()
    const app = createApp(loadServerConfig({ DEVICE_API_TOKEN: 'device-secret' }), store)

    const response = await app.request('/api/v1/cloud/visual-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: 'c1',
        transcript: 'test',
        language: 'zh',
        consent: { cloudMediaTransmission: false, cloudMemoryAccess: false },
        localVisionHints: { objectCandidates: [], sceneCandidates: [], gestures: [] },
      }),
    })

    expect(response.status).toBe(401)
    store.close()
  })

  it('rejects unauthorized admin requests', async () => {
    const store = createTestStore()
    const app = createApp(loadServerConfig({ ADMIN_API_TOKEN: 'admin-secret' }), store)

    const response = await app.request('/api/v1/admin/conversations')
    expect(response.status).toBe(401)
    store.close()
  })
})

describe('visual answer route', () => {
  it('returns provider-error when qwen is not configured', async () => {
    const store = createTestStore()
    const app = createApp(
      loadServerConfig({ DEVICE_API_TOKEN: 'device-secret', QWEN_API_KEY: '' }),
      store,
    )

    const response = await app.request('/api/v1/cloud/visual-answer', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer device-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: 'c1',
        transcript: '详细说明',
        language: 'zh',
        consent: { cloudMediaTransmission: false, cloudMemoryAccess: false },
        localVisionHints: { objectCandidates: [], sceneCandidates: [], gestures: [] },
      }),
    })

    const payload = (await response.json()) as { ok: boolean; reason?: string }
    expect(payload.ok).toBe(false)
    expect(payload.reason).toBe('provider-error')
    store.close()
  })
})
