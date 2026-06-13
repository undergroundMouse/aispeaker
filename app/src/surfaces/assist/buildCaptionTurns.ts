import type { AppLanguage, DialogueEvent, VisualAnswer } from '../../types'
import { createDialogueSegment } from '../../voice/speechResponseController'
import { splitSpeakableSegments } from '../../voice/ttsProviders'
import { detectSystemFailureVariant } from '../conversationEntry'
import type { ConversationTurn } from './presentationTypes'

export function isMediaBootstrapMessage(feedback: string): boolean {
  const normalized = feedback.trim().toLocaleLowerCase()
  if (!normalized) {
    return false
  }

  const patterns = [
    'initializing media devices',
    'media devices initialized',
    'initializing camera and microphone',
    '正在初始化摄像头和麦克风',
  ]

  return patterns.some((pattern) => normalized.includes(pattern))
}

export function buildCaptionTurnFromCurrent({
  feedback,
  lastVisualAnswer,
  lastDialogueEvent,
  language,
}: {
  feedback: string
  lastVisualAnswer: VisualAnswer | null
  lastDialogueEvent: DialogueEvent | null
  language: AppLanguage
}): ConversationTurn | null {
  if (!feedback || isMediaBootstrapMessage(feedback)) {
    return null
  }

  const userText = lastDialogueEvent?.transcript
  const isSystemAnswer =
    lastVisualAnswer?.kind === 'network-error' || lastVisualAnswer?.source === 'system'

  if (isSystemAnswer) {
    return {
      id: 'system-latest',
      userText,
      assistantText: feedback,
      assistantFinal: true,
      role: 'system',
      systemVariant: detectSystemFailureVariant(feedback, language),
    }
  }

  return {
    id: lastDialogueEvent ? `turn-${lastDialogueEvent.startedAt}` : 'assistant-latest',
    userText,
    assistantText: feedback,
    assistantFinal: true,
    meta: lastVisualAnswer?.explanation,
    role: 'assistant',
  }
}

export function mergeStreamingAssistantText(
  turnId: string,
  segments: Array<{ turnId: string; text: string; isFinal: boolean }>,
  userText?: string,
): ConversationTurn | null {
  const turnSegments = segments.filter((segment) => segment.turnId === turnId)
  if (turnSegments.length === 0) {
    return null
  }

  const assistantText = turnSegments.map((segment) => segment.text).join(' ')
  const assistantFinal = turnSegments.every((segment) => segment.isFinal)

  return {
    id: turnId,
    userText,
    assistantText,
    assistantFinal,
    role: 'assistant',
  }
}

export function buildStreamingPreviewSegments(turnId: string, text: string, isFinal: boolean) {
  const sentences = splitSpeakableSegments(text)
  if (sentences.length <= 1) {
    return [createDialogueSegment(turnId, text, isFinal)]
  }

  return sentences.map((sentence, index) =>
    createDialogueSegment(turnId, sentence, isFinal && index === sentences.length - 1),
  )
}

export function isSystemFailureMessage(feedback: string, language: AppLanguage): boolean {
  return detectSystemFailureVariant(feedback, language) !== 'generic'
}
