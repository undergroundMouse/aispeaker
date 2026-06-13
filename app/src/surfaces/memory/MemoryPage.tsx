import type {
  AppLanguage,
  CustomObjectRecord,
  LongTermMemoryConsentSettings,
  LongTermMemoryRecord,
  LongTermMemoryStoreStatus,
  LongTermMemoryType,
} from '../../types'
import { getMessages } from '../../i18n'

export interface MemoryPageProps {
  language: AppLanguage
  learnedCustomObjects: CustomObjectRecord[]
  longTermMemories: LongTermMemoryRecord[]
  longTermMemoryStatus: LongTermMemoryStoreStatus
  longTermMemoryConsent: LongTermMemoryConsentSettings
  staleLongTermCount: number
  onBack: () => void
  onDeleteCustomObject: (id: string) => void
  onExportCustomObjects: () => void
  onDeleteLongTermMemory: (id: string) => void
  onForgetAllLongTermMemories: () => void
  onExportLongTermMemories: () => void
}

function formatMemoryType(language: AppLanguage, type: LongTermMemoryType): string {
  const labels: Record<LongTermMemoryType, { zh: string; en: string }> = {
    preference: { zh: '偏好', en: 'Preference' },
    'object-location': { zh: '物体位置', en: 'Location' },
    habit: { zh: '习惯', en: 'Habit' },
    fact: { zh: '事实', en: 'Fact' },
  }

  return labels[type][language]
}

function formatDate(language: AppLanguage, timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function MemoryPage({
  language,
  learnedCustomObjects,
  longTermMemories,
  longTermMemoryStatus,
  longTermMemoryConsent,
  staleLongTermCount,
  onBack,
  onDeleteCustomObject,
  onExportCustomObjects,
  onDeleteLongTermMemory,
  onForgetAllLongTermMemories,
  onExportLongTermMemories,
}: MemoryPageProps) {
  const text = getMessages(language)

  return (
    <main className="memory-page">
      <header className="memory-page__header">
        <button type="button" className="memory-page__back" onClick={onBack} aria-label={text.backToAssist}>
          <span aria-hidden="true">←</span>
          {text.backToAssist}
        </button>
        <div className="memory-page__intro">
          <p className="memory-page__eyebrow">{text.openMemory}</p>
          <h1 className="memory-page__title">{text.memoryPageTitle}</h1>
          <p className="memory-page__subtitle">{text.memoryPageSubtitle}</p>
        </div>
      </header>

      {staleLongTermCount > 0 && (
        <div className="memory-page__alert" role="status">
          <span className="memory-page__alert-icon" aria-hidden="true">
            ⚠
          </span>
          <p>{text.staleMemoryWarning(staleLongTermCount)}</p>
        </div>
      )}

      <div className="memory-page__stats">
        <article className="memory-stat">
          <p className="memory-stat__label">{text.learnedObjectsTitle}</p>
          <p className="memory-stat__value">{learnedCustomObjects.length}</p>
        </article>
        <article className="memory-stat">
          <p className="memory-stat__label">{text.longTermMemoryTitle}</p>
          <p className="memory-stat__value">{longTermMemories.length}</p>
        </article>
        <article className="memory-stat">
          <p className="memory-stat__label">{text.settingsMemoryAuthorization}</p>
          <p className="memory-stat__value memory-stat__value--text">
            {longTermMemoryConsent.cloudMemoryAccess
              ? language === 'zh'
                ? '云端可读'
                : 'Cloud on'
              : language === 'zh'
                ? '仅本地'
                : 'Local only'}
          </p>
        </article>
      </div>

      <div className="memory-page__sections">
        <section className="memory-card" aria-labelledby="memory-objects-heading">
          <header className="memory-card__header">
            <div>
              <h2 id="memory-objects-heading" className="memory-card__title">
                {text.learnedObjectsTitle}
              </h2>
              <p className="memory-card__hint">
                {learnedCustomObjects.length > 0
                  ? language === 'zh'
                    ? `共 ${learnedCustomObjects.length} 个已学物体`
                    : `${learnedCustomObjects.length} learned object${learnedCustomObjects.length === 1 ? '' : 's'}`
                  : text.noCustomObjects}
              </p>
            </div>
            <button
              type="button"
              className="memory-btn memory-btn--secondary"
              onClick={onExportCustomObjects}
              disabled={learnedCustomObjects.length === 0}
            >
              {text.exportLearnedObjects}
            </button>
          </header>

          {learnedCustomObjects.length > 0 ? (
            <ul className="memory-card__list">
              {learnedCustomObjects.map((object) => (
                <li key={object.id} className="memory-item">
                  <div className="memory-item__icon" aria-hidden="true">
                    📦
                  </div>
                  <div className="memory-item__content">
                    <p className="memory-item__title">{object.name}</p>
                    <p className="memory-item__meta">
                      {formatDate(language, object.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="memory-btn memory-btn--danger"
                    onClick={() => onDeleteCustomObject(object.id)}
                  >
                    {text.forgetObject}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="memory-empty">
              <p className="memory-empty__title">{text.noCustomObjects}</p>
              <p className="memory-empty__hint">
                {language === 'zh'
                  ? '在 Assist 中框选物体并说「记住这个叫…」即可添加。'
                  : 'Select an object in Assist and say “remember this as…” to add one.'}
              </p>
            </div>
          )}
        </section>

        <section className="memory-card" aria-labelledby="memory-ltm-heading">
          <header className="memory-card__header">
            <div>
              <h2 id="memory-ltm-heading" className="memory-card__title">
                {text.longTermMemoryTitle}
              </h2>
              <p className="memory-card__hint">
                {longTermMemoryStatus.available
                  ? text.longTermMemorySummary(
                      longTermMemories.length,
                      longTermMemoryConsent.cloudMemoryAccess,
                      longTermMemoryConsent.cloudSummarySync,
                    )
                  : longTermMemoryStatus.message ?? text.longTermMemoryUnavailable}
              </p>
            </div>
            <div className="memory-card__toolbar">
              <button
                type="button"
                className="memory-btn memory-btn--secondary"
                onClick={onExportLongTermMemories}
                disabled={longTermMemories.length === 0}
              >
                {text.exportMemories}
              </button>
              <button
                type="button"
                className="memory-btn memory-btn--danger"
                onClick={onForgetAllLongTermMemories}
                disabled={longTermMemories.length === 0}
              >
                {text.forgetAllMemories}
              </button>
            </div>
          </header>

          {longTermMemories.length > 0 ? (
            <ul className="memory-card__list">
              {longTermMemories.map((memory) => (
                <li key={memory.id} className="memory-item memory-item--ltm">
                  <div className="memory-item__content">
                    <div className="memory-item__title-row">
                      <p className="memory-item__title">{memory.summary}</p>
                      <span className={`memory-badge memory-badge--${memory.type}`}>
                        {formatMemoryType(language, memory.type)}
                      </span>
                    </div>
                    <p className="memory-item__meta">
                      {text.lastUsed} {formatDate(language, memory.lastUsedAt)}
                      {memory.weakenedAt ? ` · ${text.weakened}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="memory-btn memory-btn--ghost"
                    onClick={() => onDeleteLongTermMemory(memory.id)}
                  >
                    {text.deleteMemory}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="memory-empty">
              <p className="memory-empty__title">{text.noLongTermMemories}</p>
              <p className="memory-empty__hint">
                {language === 'zh'
                  ? '对话中说出偏好或习惯（如「我喜欢红色」）会自动记录。'
                  : 'Share preferences in dialogue (e.g. “I like red”) to create memories.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
