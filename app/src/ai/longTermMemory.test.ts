import { describe, expect, it } from 'vitest'
import {
  InMemoryLongTermMemoryDriver,
  LocalLongTermMemoryStore,
  formatLongTermMemoryPrompt,
} from './longTermMemory'

describe('longTermMemory', () => {
  it('persists encrypted memories and scopes records by user', async () => {
    const driver = new InMemoryLongTermMemoryDriver()
    const store = new LocalLongTermMemoryStore(driver, 'test-key')

    await store.create('user-a', {
      type: 'preference',
      summary: 'User likes red objects.',
      subject: 'red objects',
      tags: ['red'],
      syncEligible: true,
    })
    await store.create('user-b', {
      type: 'habit',
      summary: 'User usually nods to confirm.',
      subject: 'nods',
      tags: ['habit'],
    })

    const persisted = await driver.load()
    expect(persisted[0]?.encryptedPayload).not.toContain('red objects')
    expect(await store.list('user-a')).toHaveLength(1)
    expect(await store.list('user-b')).toHaveLength(1)
  })

  it('retrieves relevant memories, reinforces use, and formats prompt context', async () => {
    const store = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    await store.create(
      'user-a',
      {
        type: 'preference',
        summary: 'User likes red cups.',
        subject: 'cup',
        tags: ['red', 'cup'],
      },
      1,
    )

    const memories = await store.retrieveRelevant({
      userId: 'user-a',
      transcript: 'what is this cup',
      visualLabels: ['cup'],
      recentConversationLabels: [],
      now: 2,
    })

    expect(memories[0]?.summary).toBe('User likes red cups.')
    expect(formatLongTermMemoryPrompt(memories)).toContain('User likes red cups.')
    expect((await store.list('user-a'))[0]?.strength).toBeGreaterThan(1)
  })

  it('corrects existing facts, weakens stale memories, and deletes records', async () => {
    const store = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    const created = await store.create(
      'user-a',
      {
        type: 'object-location',
        summary: 'The coffee cup is on the desk.',
        subject: 'coffee cup',
        value: 'desk',
        tags: ['coffee'],
      },
      1,
    )

    await store.create(
      'user-a',
      {
        type: 'object-location',
        summary: 'The coffee cup is now in the kitchen.',
        subject: 'coffee cup',
        value: 'kitchen',
        tags: ['coffee', 'kitchen'],
      },
      2,
    )

    const corrected = await store.list('user-a')
    expect(corrected).toHaveLength(1)
    expect(corrected[0]?.summary).toContain('kitchen')

    const weakened = await store.weakenStale('user-a', 31 * 24 * 60 * 60 * 1000)
    expect(weakened).toHaveLength(1)
    expect((await store.list('user-a'))[0]?.weakenedAt).toBeTruthy()

    expect(await store.delete('user-a', created.id)).toBe(true)
    expect(await store.list('user-a')).toHaveLength(0)
  })

  it('enforces the 200-memory LRU cap', async () => {
    const store = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')

    for (let index = 0; index < 201; index += 1) {
      await store.create(
        'user-a',
        {
          type: 'fact',
          summary: `Memory ${index}`,
          subject: `subject ${index}`,
          tags: [`tag-${index}`],
        },
        index + 1,
      )
    }

    const memories = await store.list('user-a')
    expect(memories).toHaveLength(200)
    expect(memories.some((memory) => memory.summary === 'Memory 0')).toBe(false)
  })

  it('supports forget-all, unavailable storage, and consent-gated sync summaries', async () => {
    const store = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    await store.create('user-a', {
      type: 'preference',
      summary: 'User likes quiet reminders.',
      tags: ['quiet'],
      syncEligible: true,
    })

    expect(await store.createSyncSummaries('user-a', { cloudMemoryAccess: false, cloudSummarySync: false })).toEqual([])
    expect(await store.createSyncSummaries('user-a', { cloudMemoryAccess: false, cloudSummarySync: true })).toEqual([
      expect.objectContaining({ summary: 'User likes quiet reminders.' }),
    ])

    await store.forgetAll('user-a')
    expect(await store.list('user-a')).toHaveLength(0)

    const unavailable = new LocalLongTermMemoryStore(
      {
        load: async () => {
          throw new Error('blocked')
        },
        save: async () => {},
      },
      'test-key',
    )
    expect(await unavailable.list('user-a')).toEqual([])
    expect(unavailable.isAvailable()).toBe(false)
    expect(unavailable.getStatus().message).toBe('blocked')
  })
})
