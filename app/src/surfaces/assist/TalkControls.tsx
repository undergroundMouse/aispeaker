import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface TalkControlsProps {
  language: AppLanguage
  hasSelectedRegion: boolean
  onSelectCenteredObject: () => void
  onClearSelectedObject: () => void
}

export function TalkControls({
  language,
  hasSelectedRegion,
  onSelectCenteredObject,
  onClearSelectedObject,
}: TalkControlsProps) {
  const text = getMessages(language)

  return (
    <div className="talk-controls">
      <div className="talk-controls__actions">
        <button type="button" className="talk-controls__secondary" onClick={onSelectCenteredObject}>
          {text.selectCenterObject}
        </button>
        {hasSelectedRegion && (
          <button type="button" className="talk-controls__clear" onClick={onClearSelectedObject}>
            {text.clearSelectedObject}
          </button>
        )}
      </div>
      {!hasSelectedRegion && <p className="talk-controls__hint">{text.teachingHint}</p>}
    </div>
  )
}
