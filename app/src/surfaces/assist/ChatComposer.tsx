import type { FormEvent, KeyboardEvent } from 'react'
import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'
import { usePushToTalkButton } from './usePushToTalkButton'

export interface ChatComposerProps {
  language: AppLanguage
  value: string
  disabled?: boolean
  isPushToTalkActive: boolean
  microphoneReady: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
}

export function ChatComposer({
  language,
  value,
  disabled = false,
  isPushToTalkActive,
  microphoneReady,
  onChange,
  onSubmit,
  onStartPushToTalk,
  onStopPushToTalk,
}: ChatComposerProps) {
  const text = getMessages(language)
  const pushToTalk = usePushToTalkButton({
    microphoneReady,
    onStartPushToTalk,
    onStopPushToTalk,
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!disabled && value.trim()) {
      onSubmit()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      }
    }
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <label className="chat-composer__label" htmlFor="chat-composer-input">
        {text.chatInputLabel}
      </label>
      <div className="chat-composer__row">
        <textarea
          id="chat-composer-input"
          className="chat-composer__input"
          value={value}
          placeholder={text.chatInputPlaceholder}
          rows={2}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="chat-composer__actions">
          <button
            type="button"
            className={['chat-composer__talk', isPushToTalkActive ? 'chat-composer__talk--active' : '']
              .filter(Boolean)
              .join(' ')}
            onPointerDown={pushToTalk.handlePointerDown}
            onPointerUp={pushToTalk.handlePointerUp}
            onPointerCancel={pushToTalk.handlePointerCancel}
            onPointerLeave={pushToTalk.handlePointerLeave}
            disabled={!microphoneReady}
            aria-pressed={isPushToTalkActive}
          >
            {isPushToTalkActive ? text.stopPushToTalk : text.startPushToTalk}
          </button>
          <button type="submit" className="chat-composer__send" disabled={disabled || !value.trim()}>
            {text.submitManualTranscript}
          </button>
        </div>
      </div>
      <p className="chat-composer__hint">{text.chatInputHint}</p>
    </form>
  )
}
