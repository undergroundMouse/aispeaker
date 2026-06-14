import { describe, expect, it } from 'vitest'
import { SessionStateStore } from '../services/sessionStateStore.js'

describe('SessionStateStore', () => {
  it('creates and resumes sessions', () => {
    const store = new SessionStateStore()
    const created = store.create('conv-1', 'zh')
    const resumed = store.getByResumeToken(created.resumeToken)
    expect(resumed?.sessionId).toBe(created.sessionId)
    expect(store.countActive()).toBe(1)
  })
})
