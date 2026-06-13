import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'
import { usePushToTalkButton } from './usePushToTalkButton'

export interface TalkFabProps {
  language: AppLanguage
  isPushToTalkActive: boolean
  microphoneReady: boolean
  hasSelectedRegion: boolean
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
  onSelectCenteredObject: () => void
}

export function TalkFab({
  language,
  isPushToTalkActive,
  microphoneReady,
  hasSelectedRegion,
  onStartPushToTalk,
  onStopPushToTalk,
  onSelectCenteredObject,
}: TalkFabProps) {
  const text = getMessages(language)
  const pushToTalk = usePushToTalkButton({
    microphoneReady,
    onStartPushToTalk,
    onStopPushToTalk,
  })

  return (
    <div className="talk-fab-stack">
      <button type="button" className="talk-fab__secondary" onClick={onSelectCenteredObject}>
        {text.selectCenterObject}
      </button>
      {!hasSelectedRegion && <p className="talk-fab__hint">{text.teachingHint}</p>}
      <button
        type="button"
        className={['talk-fab', isPushToTalkActive ? 'talk-fab--active' : ''].filter(Boolean).join(' ')}
        onPointerDown={pushToTalk.handlePointerDown}
        onPointerUp={pushToTalk.handlePointerUp}
        onPointerCancel={pushToTalk.handlePointerCancel}
        onPointerLeave={pushToTalk.handlePointerLeave}
        disabled={!microphoneReady}
        aria-pressed={isPushToTalkActive}
      >
        {isPushToTalkActive ? text.stopPushToTalk : text.startPushToTalk}
      </button>
    </div>
  )
}
