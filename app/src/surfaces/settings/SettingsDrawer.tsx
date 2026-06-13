import type {
  AppLanguage,
  CustomObjectRecord,
  LongTermMemoryConsentSettings,
  LongTermMemoryRecord,
  LongTermMemoryStoreStatus,
  MediaPrivacyConsent,
} from '../../types'
import { getMessages } from '../../i18n'

export interface SettingsDrawerProps {
  language: AppLanguage
  watchOnly: boolean
  mediaPrivacyConsent: MediaPrivacyConsent
  longTermMemoryConsent: LongTermMemoryConsentSettings
  longTermMemoryStatus: LongTermMemoryStoreStatus
  learnedCustomObjects: CustomObjectRecord[]
  longTermMemories: LongTermMemoryRecord[]
  staleLongTermCount: number
  onClose: () => void
  onWatchOnlyChange: (enabled: boolean) => void
  onCameraConsentChange: (enabled: boolean) => void
  onMicrophoneConsentChange: (enabled: boolean) => void
  onCloudMediaConsentChange: (enabled: boolean) => void
  onCloudMemoryAccessChange: (enabled: boolean) => void
  onCloudSummarySyncChange: (enabled: boolean) => void
  onDeleteCustomObject: (id: string) => void
  onExportCustomObjects: () => void
  onDeleteLongTermMemory: (id: string) => void
  onForgetAllLongTermMemories: () => void
  onExportLongTermMemories: () => void
}

export function SettingsDrawer({
  language,
  watchOnly,
  mediaPrivacyConsent,
  longTermMemoryConsent,
  longTermMemoryStatus,
  learnedCustomObjects,
  longTermMemories,
  staleLongTermCount,
  onClose,
  onWatchOnlyChange,
  onCameraConsentChange,
  onMicrophoneConsentChange,
  onCloudMediaConsentChange,
  onCloudMemoryAccessChange,
  onCloudSummarySyncChange,
  onDeleteCustomObject,
  onExportCustomObjects,
  onDeleteLongTermMemory,
  onForgetAllLongTermMemories,
  onExportLongTermMemories,
}: SettingsDrawerProps) {
  const text = getMessages(language)

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

        <section>
          <h3>{text.settingsPrivacy}</h3>
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
          <h3>{text.settingsMemory}</h3>
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

          {staleLongTermCount > 0 && (
            <p className="warning">{text.staleMemoryWarning(staleLongTermCount)}</p>
          )}

          <h4>{text.learnedObjectsTitle}</h4>
          <button
            type="button"
            onClick={onExportCustomObjects}
            disabled={learnedCustomObjects.length === 0}
          >
            {text.exportLearnedObjects}
          </button>
          {learnedCustomObjects.length > 0 ? (
            <ul className="learned-list">
              {learnedCustomObjects.map((object) => (
                <li key={object.id}>
                  <span>{object.name}</span>
                  <button type="button" onClick={() => onDeleteCustomObject(object.id)}>
                    {text.forgetObject}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.noCustomObjects}</p>
          )}

          <h4>{text.longTermMemoryTitle}</h4>
          <p>
            {longTermMemoryStatus.available
              ? text.longTermMemorySummary(
                  longTermMemories.length,
                  longTermMemoryConsent.cloudMemoryAccess,
                  longTermMemoryConsent.cloudSummarySync,
                )
              : longTermMemoryStatus.message ?? text.longTermMemoryUnavailable}
          </p>
          <button
            type="button"
            onClick={onForgetAllLongTermMemories}
            disabled={longTermMemories.length === 0}
          >
            {text.forgetAllMemories}
          </button>
          <button
            type="button"
            onClick={onExportLongTermMemories}
            disabled={longTermMemories.length === 0}
          >
            {text.exportMemories}
          </button>
          {longTermMemories.length > 0 ? (
            <ul className="learned-list memory-list">
              {longTermMemories.map((memory) => (
                <li key={memory.id}>
                  <span>
                    {memory.summary}
                    <small>
                      {memory.type}, {text.lastUsed} {new Date(memory.lastUsedAt).toLocaleDateString()}
                      {memory.weakenedAt ? `, ${text.weakened}` : ''}
                    </small>
                  </span>
                  <button type="button" onClick={() => onDeleteLongTermMemory(memory.id)}>
                    {text.deleteMemory}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.noLongTermMemories}</p>
          )}
        </section>
      </aside>
    </div>
  )
}
