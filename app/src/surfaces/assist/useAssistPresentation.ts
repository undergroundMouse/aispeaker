import { useEffect, useMemo, useRef, useState } from 'react'
import type { DialogueResponseSegment, DialogueEvent, ProactivePromptCandidate, SpeechPlaybackState, VisualAnswer } from '../../types'
import type { AppLanguage } from '../../types'
import { detectSystemFailureVariant } from '../conversationEntry'
import {
  buildCaptionTurnFromCurrent,
  isSystemFailureMessage,
  mergeStreamingAssistantText,
} from './buildCaptionTurns'
import type { ConversationTurn, ProactiveBannerState, SystemToastState } from './presentationTypes'
import { MAX_CAPTION_TURNS } from './presentationTypes'

export interface UseAssistPresentationInput {
  dialogueSegments: DialogueResponseSegment[]
  feedback: string
  lastVisualAnswer: VisualAnswer | null
  lastDialogueEvent: DialogueEvent | null
  lastProactivePrompt: ProactivePromptCandidate | null
  isPushToTalkActive: boolean
  speechState: SpeechPlaybackState
  language: AppLanguage
}

export interface UseAssistPresentationResult {
  captionTurns: ConversationTurn[]
  proactiveBanner: ProactiveBannerState
  systemToast: SystemToastState
  dismissSystemToast: () => void
}

const TOAST_DISMISS_MS = 5000

export function useAssistPresentation({
  dialogueSegments,
  feedback,
  lastVisualAnswer,
  lastDialogueEvent,
  lastProactivePrompt,
  isPushToTalkActive,
  speechState,
  language,
}: UseAssistPresentationInput): UseAssistPresentationResult {
  const [history, setHistory] = useState<ConversationTurn[]>([])
  const [systemToast, setSystemToast] = useState<SystemToastState>({
    visible: false,
    message: '',
    variant: 'generic',
  })
  const lastArchivedTurnIdRef = useRef<string | null>(null)
  const lastToastMessageRef = useRef<string | null>(null)

  const activeTurnId = dialogueSegments[0]?.turnId ?? null
  const streamingTurn = useMemo(() => {
    if (!activeTurnId) {
      return null
    }

    const turn = mergeStreamingAssistantText(activeTurnId, dialogueSegments, lastDialogueEvent?.transcript)
    if (!turn) {
      return null
    }

    if (
      feedback &&
      feedback !== turn.assistantText &&
      !feedback.includes(turn.assistantText) &&
      !turn.assistantText.includes(feedback)
    ) {
      return {
        ...turn,
        assistantText: feedback,
        assistantFinal: turn.assistantFinal,
      }
    }

    return turn
  }, [activeTurnId, dialogueSegments, lastDialogueEvent?.transcript, feedback])

  const currentTurn = useMemo(() => {
    if (lastProactivePrompt?.text && feedback === lastProactivePrompt.text) {
      return null
    }

    if (streamingTurn) {
      return {
        ...streamingTurn,
        meta: lastVisualAnswer?.explanation,
        role:
          lastVisualAnswer?.kind === 'network-error' || lastVisualAnswer?.source === 'system'
            ? ('system' as const)
            : ('assistant' as const),
        systemVariant:
          lastVisualAnswer?.kind === 'network-error' || lastVisualAnswer?.source === 'system'
            ? detectSystemFailureVariant(streamingTurn.assistantText, language)
            : undefined,
      }
    }

    return buildCaptionTurnFromCurrent({
      feedback,
      lastVisualAnswer,
      lastDialogueEvent,
      language,
    })
  }, [streamingTurn, feedback, lastVisualAnswer, lastDialogueEvent, language, lastProactivePrompt?.text])

  useEffect(() => {
    if (!currentTurn?.assistantFinal || !currentTurn.id) {
      return
    }

    if (lastArchivedTurnIdRef.current === currentTurn.id) {
      return
    }

    lastArchivedTurnIdRef.current = currentTurn.id
    setHistory((previous) => {
      const withoutDuplicate = previous.filter((turn) => turn.id !== currentTurn.id)
      return [currentTurn, ...withoutDuplicate].slice(0, MAX_CAPTION_TURNS)
    })
  }, [currentTurn])

  const captionTurns = useMemo(() => {
    if (!currentTurn) {
      return history
    }

    const withoutCurrent = history.filter((turn) => turn.id !== currentTurn.id)
    return [currentTurn, ...withoutCurrent].slice(0, MAX_CAPTION_TURNS)
  }, [currentTurn, history])

  const proactiveBanner = useMemo<ProactiveBannerState>(() => {
    if (!lastProactivePrompt?.text || isPushToTalkActive) {
      return { visible: false, text: '', promptId: null }
    }

    const speakingProactive =
      speechState.currentTurnId === lastProactivePrompt.id &&
      (speechState.status === 'preparing' || speechState.status === 'speaking')

    const recentlySpoken =
      speechState.currentTurnId === lastProactivePrompt.id && speechState.status === 'completed'

    if (!speakingProactive && !recentlySpoken) {
      return { visible: false, text: '', promptId: null }
    }

    return {
      visible: true,
      text: lastProactivePrompt.text,
      promptId: lastProactivePrompt.id,
    }
  }, [isPushToTalkActive, lastProactivePrompt, speechState.currentTurnId, speechState.status])

  useEffect(() => {
    if (!feedback || !isSystemFailureMessage(feedback, language)) {
      return
    }

    if (lastToastMessageRef.current === feedback) {
      return
    }

    lastToastMessageRef.current = feedback
    const variant = detectSystemFailureVariant(feedback, language)
    setSystemToast({
      visible: true,
      message: feedback,
      variant,
    })

    const timer = window.setTimeout(() => {
      setSystemToast((current) =>
        current.message === feedback ? { visible: false, message: '', variant: 'generic' } : current,
      )
    }, TOAST_DISMISS_MS)

    return () => window.clearTimeout(timer)
  }, [feedback, language])

  const dismissSystemToast = () => {
    setSystemToast({ visible: false, message: '', variant: 'generic' })
  }

  return {
    captionTurns,
    proactiveBanner,
    systemToast,
    dismissSystemToast,
  }
}
