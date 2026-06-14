import { getNetworkRetryMessage } from '../voice/cloudFailureMessages'
import type {
  AppLanguage,
  DialogueEvent,
  ProactivePromptCandidate,
  VisualAnswer,
} from '../types'

export type SystemFailureVariant = 'network' | 'budget' | 'backend' | 'consent' | 'provider' | 'generic'

export interface ConversationEntry {
  id: string
  role: ConversationRole
  text: string
  meta?: string
  systemVariant?: SystemFailureVariant
}

export type ConversationRole = 'user' | 'assistant' | 'system' | 'proactive'

export function detectSystemFailureVariant(text: string, language: AppLanguage): SystemFailureVariant {
  const normalized = text.toLocaleLowerCase()

  if (text.includes('预算') || normalized.includes('budget')) {
    return 'budget'
  }

  if (
    text.includes('无法连接本地后端') ||
    normalized.includes('cannot reach the local backend') ||
    normalized.includes('npm run dev:server')
  ) {
    return 'backend'
  }

  if (
    text.includes('授权云端媒体') ||
    normalized.includes('cloud media transmission in settings')
  ) {
    return 'consent'
  }

  if (
    text.includes('云端服务暂时不可用') ||
    text.includes('未配置 Qwen') ||
    normalized.includes('cloud service is temporarily unavailable') ||
    normalized.includes('qwen api key is not configured')
  ) {
    return 'provider'
  }

  if (
    text === getNetworkRetryMessage(language) ||
    text.includes('网络不佳') ||
    text.includes('网络不稳定') ||
    text.includes('设备离线') ||
    normalized.includes('network is poor') ||
    normalized.includes('network is unstable') ||
    normalized.includes('device is offline')
  ) {
    return 'network'
  }

  return 'generic'
}

export function buildConversationEntries({
  feedback,
  lastVisualAnswer,
  lastDialogueEvent,
  language,
}: {
  feedback: string
  lastVisualAnswer: VisualAnswer | null
  lastProactivePrompt: ProactivePromptCandidate | null
  lastDialogueEvent: DialogueEvent | null
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
