import type { AppLanguage } from '../../types'
import type { SystemFailureVariant } from '../conversationEntry'
import { getMessages } from '../../i18n'

export type ChatBubbleRole = 'user' | 'assistant' | 'system'

export interface ChatBubbleProps {
  language: AppLanguage
  role: ChatBubbleRole
  text: string
  isInterim?: boolean
  isStreaming?: boolean
  systemVariant?: SystemFailureVariant
  meta?: string
}

export function ChatBubble({
  language,
  role,
  text,
  isInterim = false,
  isStreaming = false,
  systemVariant,
  meta,
}: ChatBubbleProps) {
  const labels = getMessages(language)
  const label =
    role === 'user' ? labels.roleUser : role === 'system' ? labels.roleSystem : labels.roleAssistant

  return (
    <article
      className={[
        'chat-message',
        `chat-message--${role}`,
        isInterim ? 'chat-message--interim' : '',
        isStreaming ? 'chat-message--streaming' : '',
        systemVariant ? `chat-message--${systemVariant}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="chat-message__label">{label}</p>
      <div
        className={[
          'chat-message__bubble',
          isInterim ? 'chat-message__bubble--interim' : '',
          !text ? 'chat-message__bubble--empty' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {text}
        {isStreaming && <span className="chat-message__cursor">▍</span>}
        {isInterim && <span className="chat-message__cursor">▍</span>}
      </div>
      {meta && <p className="chat-message__meta">{meta}</p>}
    </article>
  )
}
