import { describe, expect, it } from 'vitest'
import { LocalCustomObjectStore, exportCustomObjects } from './customObjects'
import { InMemoryLongTermMemoryDriver, LocalLongTermMemoryStore, exportLongTermMemories } from './longTermMemory'

describe('memory export and cloud privacy', () => {
  it('exports only the active user long-term memories', async () => {
    const store = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver())
    await store.create('user-a', { type: 'preference', summary: 'likes red cups', tags: ['red'] })
    await store.create('user-b', { type: 'preference', summary: 'likes blue cups', tags: ['blue'] })

    const payload = await exportLongTermMemories(store, 'user-a')

    expect(payload.userId).toBe('user-a')
    expect(payload.memories).toHaveLength(1)
    expect(payload.memories[0]?.summary).toContain('red cups')
  })

  it('exports custom object metadata without feature vectors', async () => {
    const store = new LocalCustomObjectStore()
    await store.insert({
      name: 'red cup',
      vectors: [{ values: [1, 0, 0], model: 'prototype', dimensions: 3 }],
      region: { x: 0.1, y: 0.1, width: 0.2, height: 0.2, frameWidth: 640, frameHeight: 480 },
      source: 'voice-region-teaching',
    })

    const payload = await exportCustomObjects(store)

    expect(payload.objects).toHaveLength(1)
    expect(payload.objects[0]?.name).toBe('red cup')
    expect(JSON.stringify(payload)).not.toContain('"values"')
  })
})
