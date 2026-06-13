import type {
  AppLanguage,
  LongTermMemoryCreateInput,
  LongTermMemoryStore,
  LongTermMemoryType,
  VisualAnswer,
} from '../types'
import { parseTeachingName } from './customObjects'

export interface LongTermMemoryCandidate {
  type: LongTermMemoryType
  summary: string
  subject?: string
  value?: string
  tags?: string[]
  syncEligible?: boolean
}

const MEMORY_INTENT_PATTERNS: Array<{
  type: LongTermMemoryType
  pattern: RegExp
  build: (match: RegExpMatchArray, language: AppLanguage) => LongTermMemoryCreateInput | null
}> = [
  {
    type: 'preference',
    pattern: /(?:我喜欢|我偏好|我钟爱)(.+)$/u,
    build: (match, language) => {
      const subject = match[1]?.trim().replace(/[，。！？,.!?]+$/u, '')
      if (!subject) {
        return null
      }
      return {
        type: 'preference',
        summary: language === 'zh' ? `用户喜欢${subject}。` : `User likes ${subject}.`,
        subject,
        value: 'liked',
        tags: [subject, 'preference'],
      }
    },
  },
  {
    type: 'preference',
    pattern: /(?:i like|i prefer)\s+(.+)$/iu,
    build: (match) => {
      const subject = match[1]?.trim().replace(/[,.!?]+$/u, '')
      if (!subject) {
        return null
      }
      return {
        type: 'preference',
        summary: `User likes ${subject}.`,
        subject,
        value: 'liked',
        tags: [subject, 'preference'],
      }
    },
  },
  {
    type: 'object-location',
    pattern: /(.+?)(?:一般在|通常在|总是在)(.+)$/u,
    build: (match, language) => {
      const subject = match[1]?.trim()
      const value = match[2]?.trim().replace(/[，。！？,.!?]+$/u, '')
      if (!subject || !value) {
        return null
      }
      return {
        type: 'object-location',
        summary: language === 'zh' ? `${subject}一般在${value}。` : `${subject} is usually at ${value}.`,
        subject,
        value,
        tags: [subject, value, 'location'],
      }
    },
  },
  {
    type: 'habit',
    pattern: /(?:我习惯|我通常会)(.+)$/u,
    build: (match, language) => {
      const value = match[1]?.trim().replace(/[，。！？,.!?]+$/u, '')
      if (!value) {
        return null
      }
      return {
        type: 'habit',
        summary: language === 'zh' ? `用户习惯${value}。` : `User usually ${value}.`,
        value,
        tags: [value, 'habit'],
      }
    },
  },
]

const EXPLICIT_MEMORY_PREFIX_PATTERNS = [
  /^(?:请)?(?:帮我|给我)?(?:记住|记一下|记录一下|记下来|记得|以后记得)\s*(.+)$/u,
  /^(?:please\s+)?(?:remember|note|save|keep in mind)(?:\s+that)?\s+(.+)$/iu,
]

export function extractLocalMemoryCandidates(
  transcript: string,
  language: AppLanguage,
): LongTermMemoryCreateInput[] {
  if (parseTeachingName(transcript)) {
    return []
  }

  const normalized = transcript.trim()
  const candidates: LongTermMemoryCreateInput[] = []

  for (const rule of MEMORY_INTENT_PATTERNS) {
    const match = normalized.match(rule.pattern)
    if (!match) {
      continue
    }

    const candidate = rule.build(match, language)
    if (candidate) {
      candidates.push(candidate)
    }
  }

  return candidates.slice(0, 2)
}

export function parseExplicitMemoryIntent(
  transcript: string,
  language: AppLanguage,
): LongTermMemoryCreateInput | null {
  if (parseTeachingName(transcript)) {
    return null
  }

  const content = extractExplicitMemoryContent(transcript)
  if (!content) {
    return null
  }

  const existingCandidates = extractLocalMemoryCandidates(content, language)
  if (existingCandidates[0]) {
    return existingCandidates[0]
  }

  return buildFactMemory(content, language)
}

export function getMemoryCandidatesFromAnswer(answer: VisualAnswer): LongTermMemoryCreateInput[] {
  return (answer.memoryCandidates ?? []).slice(0, 2)
}

export async function persistDialogueMemoryCandidates({
  store,
  userId,
  candidates,
}: {
  store: LongTermMemoryStore
  userId: string
  candidates: LongTermMemoryCreateInput[]
}): Promise<void> {
  if (!store.isAvailable() || candidates.length === 0) {
    return
  }

  for (const candidate of candidates) {
    if (!candidate.summary?.trim()) {
      continue
    }
    await store.create(userId, candidate)
  }
}

export function shouldSkipDialogueMemoryPersistence({
  transcript,
  answer,
}: {
  transcript: string
  answer: VisualAnswer
}): boolean {
  if (parseTeachingName(transcript)) {
    return true
  }

  const normalized = transcript.trim().toLocaleLowerCase()
  const isOneOffObjectQuestion = ['这是什么', 'what is this', 'what is that', '这是啥'].some((phrase) =>
    normalized.includes(phrase),
  )

  return isOneOffObjectQuestion && getMemoryCandidatesFromAnswer(answer).length === 0
}

function extractExplicitMemoryContent(transcript: string): string | null {
  const normalized = transcript.trim()
  for (const pattern of EXPLICIT_MEMORY_PREFIX_PATTERNS) {
    const content = normalized.match(pattern)?.[1]?.trim().replace(/[，。！？,.!?]+$/u, '')
    if (content) {
      return content
    }
  }

  return null
}

function buildFactMemory(content: string, language: AppLanguage): LongTermMemoryCreateInput {
  return {
    type: 'fact',
    summary: language === 'zh' ? `用户让我记住：${content}。` : `User asked me to remember: ${content}.`,
    value: content,
    tags: createFactTags(content),
  }
}

function createFactTags(content: string): string[] {
  return content
    .split(/[\s，。！？,.!?、]+/u)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
}
