import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface TalkControlsProps {
  language: AppLanguage
  isPushToTalkActive: boolean
  microphoneReady: boolean
  hasSelectedRegion: boolean
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
  onSelectCenteredObject: () => void
}

export function TalkControls({
  language,
  isPushToTalkActive,
  microphoneReady,
  hasSelectedRegion,
  onStartPushToTalk,
  onStopPushToTalk,
  onSelectCenteredObject,
}: TalkControlsProps) {
  const text = getMessages(language)

  return (
    <div className="talk-controls">
      <button
        type="button"
        className="talk-controls__primary"
        onMouseDown={onStartPushToTalk}
        onMouseUp={onStopPushToTalk}
        disabled={!microphoneReady}
      >
        {isPushToTalkActive ? text.stopPushToTalk : text.startPushToTalk}
      </button>
      <button type="button" className="talk-controls__secondary" onClick={onSelectCenteredObject}>
        {text.selectCenterObject}
      </button>
      {!hasSelectedRegion && <p className="talk-controls__hint">{text.teachingHint}</p>}
    </div>
  )
}
