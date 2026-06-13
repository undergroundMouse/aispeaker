import type { AppLanguage, ConversationTelemetryRecord } from '../../types'
import { getMessages, type SurfaceMessages } from '../../i18n'

function cloudProviderLabel(kind: string, text: SurfaceMessages): string {
  if (kind === 'backend') {
    return text.cloudBackend
  }

  if (kind === 'qwen') {
    return text.cloudQwen
  }

  return text.cloudMock
}

export interface OperatorDashboardProps {
  language: AppLanguage
  cloudProviderKind: string
  dailySpend: number
  cloudReductionPercent: number
  conversationTelemetry: ConversationTelemetryRecord[]
  onBack: () => void
  onSetBudgetCap: (cap: number) => void
  onClearBudgetCap: () => void
}

export function OperatorDashboard({
  language,
  cloudProviderKind,
  dailySpend,
  cloudReductionPercent,
  conversationTelemetry,
  onBack,
  onSetBudgetCap,
  onClearBudgetCap,
}: OperatorDashboardProps) {
  const text = getMessages(language)

  return (
    <main className="app-shell operator-shell">
      <section className="hero-panel hero-panel--compact">
        <p className="eyebrow">Operator</p>
        <h1>{text.operatorTitle}</h1>
        <p className="subtitle">{text.operatorSubtitle}</p>
      </section>

      <section className="operator-dashboard">
        <div className="operator-actions">
          <button type="button" className="ghost-button" onClick={onBack}>
            {text.backToAssist}
          </button>
        </div>

        <article className="operator-card">
          <h2>{text.operatorOverview}</h2>
          <p>
            {text.statusCloud}: {cloudProviderLabel(cloudProviderKind, text)}
          </p>
          <p>
            {text.dailySpend}: ${dailySpend.toFixed(4)} | {text.cloudReduction}: {cloudReductionPercent}%
          </p>
          <div className="button-row">
            <button type="button" onClick={() => onSetBudgetCap(0.01)}>
              {text.setBudgetCap}
            </button>
            <button type="button" onClick={onClearBudgetCap}>
              {text.clearBudgetCap}
            </button>
          </div>
        </article>

        <article className="operator-card">
          <h2>{text.operatorTelemetry}</h2>
          {conversationTelemetry.length > 0 ? (
            <ul className="learned-list">
              {conversationTelemetry.map((record) => (
                <li key={record.conversationId}>
                  <span>
                    {record.conversationId}: {record.estimatedTokens} {text.estimatedTokens} /{' '}
                    {record.actualTokens ?? 0} {text.actualTokens}, ${record.estimatedCost.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.noTelemetry}</p>
          )}
        </article>
      </section>
    </main>
  )
}
