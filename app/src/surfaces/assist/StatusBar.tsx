import type { AppLanguage } from '../../types'
import { getMessages, type SurfaceMessages } from '../../i18n'

export interface StatusBarProps {
  language: AppLanguage
  networkState: string
  cloudProviderKind: string
  proactiveEnabled: boolean
  speechStatus: string
  operatorAvailable: boolean
  onOpenSettings: () => void
  onOpenOperator: () => void
}

function cloudProviderLabel(kind: string, text: SurfaceMessages): string {
  if (kind === 'backend') {
    return text.cloudBackend
  }

  if (kind === 'qwen') {
    return text.cloudQwen
  }

  return text.cloudMock
}

export function StatusBar({
  language,
  networkState,
  cloudProviderKind,
  proactiveEnabled,
  speechStatus,
  operatorAvailable,
  onOpenSettings,
  onOpenOperator,
}: StatusBarProps) {
  const text = getMessages(language)

  return (
    <header className="status-bar">
      <div className="status-indicators">
        <span className={`status-pill status-pill--network status-pill--${networkState}`}>
          {text.statusNetwork}: {networkState}
        </span>
        <span className="status-pill">{text.statusCloud}: {cloudProviderLabel(cloudProviderKind, text)}</span>
        <span className="status-pill">
          {text.statusProactive}: {proactiveEnabled ? text.on : text.off}
        </span>
        <span className="status-pill">
          {text.statusSpeech}: {speechStatus}
        </span>
      </div>
      <div className="status-actions">
        <button type="button" className="ghost-button" onClick={onOpenSettings}>
          {text.openSettings}
        </button>
        {operatorAvailable && (
          <button type="button" className="ghost-button" onClick={onOpenOperator}>
            {text.openOperator}
          </button>
        )}
      </div>
    </header>
  )
}
