import type { AppLanguage } from '../../types'
import { getMessages } from '../../i18n'

export interface AmbientChromeProps {
  language: AppLanguage
  networkState: string
  memoryBadgeCount: number
  onOpenMemory: () => void
  onOpenSettings: () => void
}

export function AmbientChrome({
  language,
  networkState,
  memoryBadgeCount,
  onOpenMemory,
  onOpenSettings,
}: AmbientChromeProps) {
  const text = getMessages(language)

  return (
    <header className="ambient-chrome">
      <button
        type="button"
        className="ambient-chrome__memory"
        onClick={onOpenMemory}
        aria-label={text.openMemory}
      >
        <span className="ambient-chrome__memory-icon" aria-hidden="true">
          🧠
        </span>
        {text.openMemory}
        {memoryBadgeCount > 0 && (
          <span className="ambient-chrome__badge" aria-label={text.memoryWarningsBadge(memoryBadgeCount)}>
            {memoryBadgeCount}
          </span>
        )}
      </button>
      <button
        type="button"
        className="ambient-chrome__settings"
        onClick={onOpenSettings}
        aria-label={text.openSettings}
      >
        <span className="ambient-chrome__settings-icon" aria-hidden="true">
          ⚙
        </span>
      </button>
      <span
        className={`ambient-chrome__network ambient-chrome__network--${networkState}`}
        title={`${text.statusNetwork}: ${networkState}`}
        aria-label={`${text.statusNetwork}: ${networkState}`}
      />
    </header>
  )
}
