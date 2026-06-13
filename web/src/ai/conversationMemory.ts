import type {
  ConversationMemoryEntry,
  ConversationMemoryKind,
  ConversationMemoryState,
  VisualAnswer,
} from '../types'
import { normalizePhrase } from '../voice/localCommands'

const DEFAULT_MAX_ENTRIES = 8

export function emptyConversationMemory(): ConversationMemoryState {
  return { entries: [] }
}

export function updateConversationMemory(
  memory: ConversationMemoryState,
  answer: VisualAnswer,
  now = Date.now(),
  maxEntries = DEFAULT_MAX_ENTRIES,
): ConversationMemoryState {
  const entries: ConversationMemoryEntry[] = []

  for (const entity of answer.referencedEntities) {
    entries.push({
      id: `${answer.kind}-${entity.label}-${now}`,
      kind: toMemoryKind(answer.kind),
      label: entity.label,
      confidence: entity.confidence,
      region: entity.region,
      explanation: answer.explanation,
      evidenceAvailable: answer.evidenceAvailable,
      createdAt: now,
    })
  }

  if (answer.answer) {
    entries.push({
      id: `answer-${now}`,
      kind: 'answer',
      label: answer.answer,
      confidence: answer.confidence,
      explanation: answer.explanation,
      evidenceAvailable: answer.evidenceAvailable,
      createdAt: now,
    })
  }

  return {
    entries: [...entries, ...memory.entries].slice(0, maxEntries),
  }
}

export function resolveFollowUpReference(
  transcript: string,
  memory: ConversationMemoryState,
): ConversationMemoryEntry | null {
  const normalized = normalizePhrase(transcript)
  const referencesPriorEntity = ['它', '这个', 'it', 'that', 'that object'].some((phrase) =>
    normalized.includes(phrase),
  )

  if (!referencesPriorEntity) {
    return null
  }

  const entityEntries = memory.entries.filter((entry) =>
    ['object', 'scene', 'gesture', 'topic'].includes(entry.kind),
  )

  if (entityEntries.length !== 1) {
    return null
  }

  return entityEntries[0]
}

function toMemoryKind(answerKind: VisualAnswer['kind']): ConversationMemoryKind {
  if (answerKind === 'object' || answerKind === 'scene' || answerKind === 'gesture') {
    return answerKind
  }

  return 'topic'
}
