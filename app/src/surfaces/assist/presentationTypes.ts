import type { SystemFailureVariant } from '../conversationEntry'

export interface ConversationTurn {
  id: string
  userText?: string
  assistantText: string
  assistantFinal: boolean
  meta?: string
  role: 'assistant' | 'system'
  systemVariant?: SystemFailureVariant
}

export interface ProactiveBannerState {
  visible: boolean
  text: string
  promptId: string | null
}

export interface SystemToastState {
  visible: boolean
  message: string
  variant: SystemFailureVariant
}

export interface CameraInteractionFeedback {
  kind: 'success' | 'failure' | 'none'
  message?: string
}

export const MAX_CAPTION_TURNS = 10
