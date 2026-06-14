import type { ProactiveBannerState } from './presentationTypes'
import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface ProactiveBannerProps {
  language: AppLanguage
  banner: ProactiveBannerState
}

export function ProactiveBanner({ language, banner }: ProactiveBannerProps) {
  const text = getMessages(language)

  if (!banner.visible) {
    return null
  }

  return (
    <aside className="proactive-banner" role="status" aria-live="polite">
      <p className="proactive-banner__label">{text.roleProactive}</p>
      <p className="proactive-banner__text">{banner.text}</p>
    </aside>
  )
}
