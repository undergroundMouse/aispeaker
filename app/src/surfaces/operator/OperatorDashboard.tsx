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
  sessionStatus?: string
  omniSessionStatus?: string
  hybridVoicePath?: string
  omniFallbackReason?: string | null
  activeSessions?: number
  omniSuccessRate?: number
  circuitBreakers?: Record<string, { isOpen: boolean }>
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
  sessionStatus,
  omniSessionStatus,
  hybridVoicePath,
  omniFallbackReason,
  activeSessions,
  omniSuccessRate,
  circuitBreakers,
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
          {sessionStatus ? (
            <p>
              Legacy session: {sessionStatus} | Active: {activeSessions ?? 0}
            </p>
          ) : null}
          {omniSessionStatus ? (
            <p>
              Omni session: {omniSessionStatus} | Voice path: {hybridVoicePath ?? 'omni'}
            </p>
          ) : null}
          {omniFallbackReason ? <p>Fallback: {omniFallbackReason}</p> : null}
          {circuitBreakers ? (
            <p>
              Circuit: ASR {circuitBreakers.asr?.isOpen ? 'OPEN' : 'closed'} | Omni{' '}
              {circuitBreakers['omni-realtime']?.isOpen ? 'OPEN' : 'closed'}
              {typeof omniSuccessRate === 'number' ? ` | Omni success ${Math.round(omniSuccessRate * 100)}%` : ''}
            </p>
          ) : null}
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
                    {record.omniSessionDurationMs
                      ? ` | Omni ${Math.round(record.omniSessionDurationMs / 1000)}s`
                      : ''}
                    {record.vlVerifyRequestCount ? ` | VL verify ${record.vlVerifyRequestCount}` : ''}
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
