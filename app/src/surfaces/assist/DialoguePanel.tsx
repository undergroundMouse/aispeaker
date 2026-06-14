import type { ConversationTurn } from './presentationTypes'
import type { AppLanguage, AsrCaptureState } from '../../types'
import type { ProactiveBannerState } from './presentationTypes'
import { ProactiveBanner } from './ProactiveBanner'
import { ChatBubble } from './ChatBubble'
import { ChatComposer } from './ChatComposer'
import { getMessages } from '../../i18n'

export interface DialoguePanelProps {
  language: AppLanguage
  asrState: AsrCaptureState
  isPushToTalkActive: boolean
  speechStatus: string
  captionTurns: ConversationTurn[]
  proactiveBanner: ProactiveBannerState
  chatInputText: string
  microphoneReady: boolean
  onChatInputChange: (value: string) => void
  onChatInputSubmit: () => void
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
  onOpenPrivacySettings: () => void
}

function getLiveUserText(
  asrState: AsrCaptureState,
  isPushToTalkActive: boolean,
  listeningPlaceholder: string,
): { text: string; isInterim: boolean } {
  if (asrState.interimText) {
    return { text: asrState.interimText, isInterim: asrState.status === 'listening' }
  }

  if (asrState.finalText) {
    return { text: asrState.finalText, isInterim: false }
  }

  if (isPushToTalkActive) {
    return { text: listeningPlaceholder, isInterim: true }
  }

  return { text: '', isInterim: false }
}

export function DialoguePanel({
  language,
  asrState,
  isPushToTalkActive,
  speechStatus,
  captionTurns,
  proactiveBanner,
  chatInputText,
  microphoneReady,
  onChatInputChange,
  onChatInputSubmit,
  onStartPushToTalk,
  onStopPushToTalk,
  onOpenPrivacySettings,
}: DialoguePanelProps) {
  const text = getMessages(language)
  const liveUser = getLiveUserText(asrState, isPushToTalkActive, text.listeningPlaceholder)
  const showLiveUser =
    Boolean(liveUser.text) ||
    isPushToTalkActive ||
    asrState.status === 'listening' ||
    asrState.status === 'committing'
  const orderedTurns = [...captionTurns].reverse()
  const hasThread = orderedTurns.length > 0 || showLiveUser

  return (
    <aside className="dialogue-panel">
      <header className="dialogue-panel__header">
        <h2 className="dialogue-panel__title">{text.dialoguePanelTitle}</h2>
        <button
          type="button"
          className="dialogue-panel__permissions-button"
          onClick={onOpenPrivacySettings}
          aria-label={text.managePermissions}
        >
          <span aria-hidden="true">⚙</span>
          {text.managePermissions}
        </button>
      </header>

      <ProactiveBanner language={language} banner={proactiveBanner} />

      <section className="chat-thread" aria-live="polite">
        {asrState.status === 'unavailable' && (
          <p className="chat-thread__notice">{text.asrUnavailable}</p>
        )}
        {asrState.status === 'failed' && asrState.errorMessage && (
          <p className="chat-thread__notice chat-thread__notice--error">{asrState.errorMessage}</p>
        )}

        {!hasThread && <p className="chat-thread__empty">{text.conversationEmpty}</p>}

        {orderedTurns.map((turn) => (
          <div key={turn.id} className="chat-turn">
            {turn.userText && <ChatBubble language={language} role="user" text={turn.userText} />}
            <ChatBubble
              language={language}
              role={turn.role === 'system' ? 'system' : 'assistant'}
              text={turn.assistantText}
              isStreaming={!turn.assistantFinal}
              systemVariant={turn.systemVariant}
              meta={turn.meta}
            />
          </div>
        ))}

        {showLiveUser && (
          <div className="chat-turn chat-turn--live">
            {(speechStatus === 'speaking' || speechStatus === 'preparing') && !isPushToTalkActive && (
              <p className="chat-thread__notice">{text.interruptTtsHint}</p>
            )}
            <ChatBubble
              language={language}
              role="user"
              text={liveUser.text || text.userTranscriptEmpty}
              isInterim={liveUser.isInterim || !liveUser.text}
            />
          </div>
        )}
      </section>

      <ChatComposer
        language={language}
        value={chatInputText}
        disabled={isPushToTalkActive}
        isPushToTalkActive={isPushToTalkActive}
        microphoneReady={microphoneReady}
        onChange={onChatInputChange}
        onSubmit={onChatInputSubmit}
        onStartPushToTalk={onStartPushToTalk}
        onStopPushToTalk={onStopPushToTalk}
      />
    </aside>
  )
}
