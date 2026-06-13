import type {
  AppLanguage,
  DeviceStatus,
  LongTermMemoryConsentSettings,
  MediaPrivacyConsent,
} from '../../types'
import { useEffect, useRef } from 'react'
import { getMessages } from '../../i18n'
import { formatPermissionStatus } from './formatPermissionStatus'

export type SettingsFocusSection = 'privacy' | null

export interface SettingsDrawerProps {
  language: AppLanguage
  watchOnly: boolean
  cameraStatus: DeviceStatus
  microphoneStatus: DeviceStatus
  focusSection?: SettingsFocusSection
  mediaPrivacyConsent: MediaPrivacyConsent
  longTermMemoryConsent: LongTermMemoryConsentSettings
  onClose: () => void
  onWatchOnlyChange: (enabled: boolean) => void
  onCameraConsentChange: (enabled: boolean) => void
  onMicrophoneConsentChange: (enabled: boolean) => void
  onCloudMediaConsentChange: (enabled: boolean) => void
  onCloudMemoryAccessChange: (enabled: boolean) => void
  onCloudSummarySyncChange: (enabled: boolean) => void
}

export function SettingsDrawer({
  language,
  watchOnly,
  cameraStatus,
  microphoneStatus,
  focusSection = null,
  mediaPrivacyConsent,
  longTermMemoryConsent,
  onClose,
  onWatchOnlyChange,
  onCameraConsentChange,
  onMicrophoneConsentChange,
  onCloudMediaConsentChange,
  onCloudMemoryAccessChange,
  onCloudSummarySyncChange,
}: SettingsDrawerProps) {
  const text = getMessages(language)
  const privacySectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (focusSection !== 'privacy') {
      return
    }

    privacySectionRef.current?.scrollIntoView({ block: 'start' })
    privacySectionRef.current?.focus({ preventScroll: true })
  }, [focusSection])

  return (
    <div className="settings-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="settings-drawer"
        role="dialog"
        aria-label={text.settingsTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-drawer__header">
          <h2>{text.settingsTitle}</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            {text.closeSettings}
          </button>
        </header>

        <section
          ref={privacySectionRef}
          className={['settings-drawer__section', focusSection === 'privacy' ? 'settings-drawer__section--focused' : '']
            .filter(Boolean)
            .join(' ')}
          tabIndex={-1}
        >
          <h3>{text.settingsPrivacy}</h3>
          <dl className="permission-status-grid">
            <div>
              <dt>{text.cameraPermissionLabel}</dt>
              <dd>{formatPermissionStatus(language, cameraStatus)}</dd>
            </div>
            <div>
              <dt>{text.microphonePermissionLabel}</dt>
              <dd>{formatPermissionStatus(language, microphoneStatus)}</dd>
            </div>
          </dl>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.cameraCapture}
              onChange={(event) => onCameraConsentChange(event.target.checked)}
            />
            {text.authorizeCamera}
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.microphoneCapture}
              onChange={(event) => onMicrophoneConsentChange(event.target.checked)}
            />
            {text.authorizeMicrophone}
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.cloudMediaTransmission}
              onChange={(event) => onCloudMediaConsentChange(event.target.checked)}
            />
            {text.authorizeCloudMedia}
          </label>
        </section>

        <section>
          <h3>{text.settingsDialogue}</h3>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={watchOnly}
              onChange={(event) => onWatchOnlyChange(event.target.checked)}
            />
            {text.watchOnly}
          </label>
        </section>

        <section>
          <h3>{text.settingsMemoryAuthorization}</h3>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={longTermMemoryConsent.cloudMemoryAccess}
              onChange={(event) => onCloudMemoryAccessChange(event.target.checked)}
            />
            {text.allowCloudMemory}
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={longTermMemoryConsent.cloudSummarySync}
              onChange={(event) => onCloudSummarySyncChange(event.target.checked)}
            />
            {text.enableSummarySync}
          </label>
        </section>
      </aside>
    </div>
  )
}
