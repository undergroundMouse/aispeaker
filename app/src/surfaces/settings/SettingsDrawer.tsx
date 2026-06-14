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
  sessionStatus?: string
  omniSessionStatus?: string
  hybridVoicePath?: string
  omniFallbackReason?: string | null
  omniVlCorrectionMode?: string
  hybridOmniDialogueEnabled: boolean
  omniPureDialogueEnabled: boolean
  hybridOmniBuildEnabled?: boolean
  onHybridOmniDialogueChange: (enabled: boolean) => void
  onOmniPureDialogueChange: (enabled: boolean) => void
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
  sessionStatus,
  omniSessionStatus,
  hybridVoicePath,
  omniFallbackReason,
  omniVlCorrectionMode,
  hybridOmniDialogueEnabled,
  omniPureDialogueEnabled,
  hybridOmniBuildEnabled = true,
  onHybridOmniDialogueChange,
  onOmniPureDialogueChange,
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

        <div className="settings-drawer__content">
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
          {sessionStatus ? (
            <p className="settings-hint">
              {language === 'zh' ? 'Legacy 会话' : 'Legacy session'}: {sessionStatus}
            </p>
          ) : null}
          {hybridOmniDialogueEnabled ? (
            <p className="settings-hint">
              {language === 'zh' ? '视觉纠错策略' : 'Visual correction policy'}: {omniVlCorrectionMode ?? 'ui-only'}
            </p>
          ) : null}
        </section>

        <section>
          <h3>{text.settingsDialogue}</h3>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={hybridOmniDialogueEnabled}
              disabled={!hybridOmniBuildEnabled}
              onChange={(event) => onHybridOmniDialogueChange(event.target.checked)}
            />
            {text.enableHybridOmniDialogue}
          </label>
          {!hybridOmniBuildEnabled ? (
            <p className="settings-hint">{text.hybridOmniBuildDisabledHint}</p>
          ) : null}
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={omniPureDialogueEnabled}
              disabled={!hybridOmniBuildEnabled || !hybridOmniDialogueEnabled}
              onChange={(event) => onOmniPureDialogueChange(event.target.checked)}
            />
            {text.enableOmniPureDialogue}
          </label>
          {hybridOmniDialogueEnabled && omniPureDialogueEnabled ? (
            <p className="settings-hint">{text.omniPureDialogueHint}</p>
          ) : null}
          {hybridOmniDialogueEnabled && !mediaPrivacyConsent.cloudMediaTransmission ? (
            <p className="settings-hint">{text.hybridOmniCloudMediaHint}</p>
          ) : null}
          {hybridOmniDialogueEnabled ? (
            <p className="settings-hint">
              {language === 'zh' ? 'Omni 会话' : 'Omni session'}: {omniSessionStatus ?? 'disconnected'}
            </p>
          ) : null}
          {hybridOmniDialogueEnabled ? (
            <p className="settings-hint">
              {language === 'zh' ? '语音路径' : 'Voice path'}: {hybridVoicePath ?? 'omni'}
            </p>
          ) : null}
          {hybridOmniDialogueEnabled && omniFallbackReason ? (
            <p className="settings-hint">
              {language === 'zh' ? '回退原因' : 'Fallback reason'}: {omniFallbackReason}
            </p>
          ) : null}
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
        </div>
      </aside>
    </div>
  )
}
