import type { ConversationEntry } from '../conversationEntry'
import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface ConversationStripProps {
  language: AppLanguage
  entries: ConversationEntry[]
}

export function ConversationStrip({ language, entries }: ConversationStripProps) {
  const text = getMessages(language)

  if (entries.length === 0) {
    return (
      <section className="conversation-strip conversation-strip--empty" aria-live="polite">
        <p>{text.conversationEmpty}</p>
      </section>
    )
  }

  return (
    <section className="conversation-strip" aria-live="polite">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className={[
            'conversation-entry',
            `conversation-entry--${entry.role}`,
            entry.systemVariant ? `conversation-entry--${entry.systemVariant}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <p className="conversation-entry__label">
            {entry.role === 'user'
              ? text.roleUser
              : entry.role === 'assistant'
                ? text.roleAssistant
                : entry.role === 'proactive'
                  ? text.roleProactive
                  : text.roleSystem}
          </p>
          <p className="conversation-entry__text">{entry.text}</p>
          {entry.meta && <p className="conversation-entry__meta">{entry.meta}</p>}
        </article>
      ))}
    </section>
  )
}
