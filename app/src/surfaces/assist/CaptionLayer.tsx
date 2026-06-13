import type { ConversationTurn } from './presentationTypes'
import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface CaptionLayerProps {
  language: AppLanguage
  turns: ConversationTurn[]
}

export function CaptionLayer({ language, turns }: CaptionLayerProps) {
  const text = getMessages(language)

  if (turns.length === 0) {
    return (
      <section className="caption-layer caption-layer--empty" aria-live="polite">
        <p>{text.conversationEmpty}</p>
      </section>
    )
  }

  return (
    <section className="caption-layer" aria-live="polite">
      <div className="caption-layer__scroll">
        {turns.map((turn, index) => (
          <article
            key={turn.id}
            className={[
              'caption-turn',
              `caption-turn--${turn.role}`,
              turn.systemVariant ? `caption-turn--${turn.systemVariant}` : '',
              index === 0 ? 'caption-turn--latest' : 'caption-turn--history',
              !turn.assistantFinal ? 'caption-turn--streaming' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {turn.userText && (
              <p className="caption-turn__user">
                <span className="caption-turn__label">{text.roleUser}</span>
                {turn.userText}
              </p>
            )}
            <p className="caption-turn__assistant">
              <span className="caption-turn__label">
                {turn.role === 'system' ? text.roleSystem : text.roleAssistant}
              </span>
              {turn.assistantText}
              {!turn.assistantFinal && <span className="caption-turn__cursor">▍</span>}
            </p>
            {turn.meta && <p className="caption-turn__meta">{turn.meta}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
