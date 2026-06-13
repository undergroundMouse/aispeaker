import { getNetworkRetryMessage } from '../voice/localCommands'
import type {
  AppLanguage,
  DialogueEvent,
  ProactivePromptCandidate,
  VisualAnswer,
} from '../types'

export type ConversationRole = 'user' | 'assistant' | 'system' | 'proactive'
export type SystemFailureVariant = 'network' | 'budget' | 'generic'

export interface ConversationEntry {
  id: string
  role: ConversationRole
  text: string
  meta?: string
  systemVariant?: SystemFailureVariant
}

export function detectSystemFailureVariant(text: string, language: AppLanguage): SystemFailureVariant {
  if (text.includes('预算') || text.toLowerCase().includes('budget')) {
    return 'budget'
  }

  if (text === getNetworkRetryMessage(language)) {
    return 'network'
  }

  return 'generic'
}

export function buildConversationEntries({
  feedback,
  lastVisualAnswer,
  lastProactivePrompt,
  lastDialogueEvent,
  language,
}: {
  feedback: string
  lastVisualAnswer: VisualAnswer | null
  lastDialogueEvent: DialogueEvent | null
  lastProactivePrompt: ProactivePromptCandidate | null
  language: AppLanguage
}): ConversationEntry[] {
  const entries: ConversationEntry[] = []

  if (lastDialogueEvent?.transcript) {
    entries.push({
      id: 'user-latest',
      role: 'user',
      text: lastDialogueEvent.transcript,
    })
  }

  if (lastProactivePrompt?.text && feedback === lastProactivePrompt.text) {
    entries.push({
      id: `proactive-${lastProactivePrompt.id}`,
      role: 'proactive',
      text: lastProactivePrompt.text,
    })
    return entries
  }

  if (!feedback) {
    return entries
  }

  const isSystemAnswer =
    lastVisualAnswer?.kind === 'network-error' || lastVisualAnswer?.source === 'system'

  if (isSystemAnswer) {
    entries.push({
      id: 'system-latest',
      role: 'system',
      text: feedback,
      systemVariant: detectSystemFailureVariant(feedback, language),
    })
    return entries
  }

  entries.push({
    id: 'assistant-latest',
    role: 'assistant',
    text: feedback,
    meta: lastVisualAnswer?.explanation,
  })

  return entries
}
