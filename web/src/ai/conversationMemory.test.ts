import { describe, expect, it } from 'vitest'
import { emptyConversationMemory, resolveFollowUpReference, updateConversationMemory } from './conversationMemory'

describe('conversationMemory', () => {
  it('updates bounded structured memory from visual answers', () => {
    const memory = updateConversationMemory(
      emptyConversationMemory(),
      {
        kind: 'object',
        answer: '这是 cup。',
        source: 'local',
        confidence: 0.9,
        referencedEntities: [{ label: 'cup', confidence: 0.9 }],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      100,
    )

    expect(memory.entries.map((entry) => entry.kind)).toEqual(['object', 'answer'])
    expect(memory.entries[0]?.label).toBe('cup')
  })

  it('resolves unambiguous follow-up references', () => {
    const memory = updateConversationMemory(
      emptyConversationMemory(),
      {
        kind: 'object',
        answer: 'This is cup.',
        source: 'local',
        confidence: 0.9,
        referencedEntities: [{ label: 'cup', confidence: 0.9 }],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      100,
    )

    expect(resolveFollowUpReference('what color is it', memory)?.label).toBe('cup')
  })

  it('does not resolve ambiguous follow-up references', () => {
    const memory = {
      entries: [
        { id: 'object-cup', kind: 'object' as const, label: 'cup', createdAt: 100 },
        { id: 'object-book', kind: 'object' as const, label: 'book', createdAt: 99 },
      ],
    }

    expect(resolveFollowUpReference('what is it', memory)).toBeNull()
  })
})
