import type {
  AppLanguage,
  ConversationMemoryState,
  ConversationTelemetryRecord,
  CustomObjectRecord,
  DialogueEvent,
  LocalCommandMatch,
  LocalVisionSignals,
  LongTermMemoryConsentSettings,
  LongTermMemoryRecord,
  LongTermMemoryStoreStatus,
  ProactivePromptCandidate,
  ProactivePromptState,
  SampledVideoFrame,
  SpeechPlaybackState,
  VisualAnswer,
  VisionRegion,
  ActiveVisualEvidence,
  VoiceLatencyMetrics,
} from '../../types'
import { getMessages } from '../../i18n'

export interface DebugPanelProps {
  language: AppLanguage
  expanded: boolean
  transcript: string
  showDebugEvidence: boolean
  mediaState: { status: string; cameraStatus: string; microphoneStatus: string; errorMessage?: string | null }
  networkState: string
  samplingMode: string
  speechState: SpeechPlaybackState
  cloudProviderKind: string
  proactivePromptState: ProactivePromptState
  proactiveDetectorStatus: string
  lastCommand: LocalCommandMatch | null
  lastDialogueEvent: DialogueEvent | null
  lastFrame: SampledVideoFrame | null
  lastVisualAnswer: VisualAnswer | null
  activeVisualEvidence: ActiveVisualEvidence | null
  lastLocalVision: LocalVisionSignals | null
  lastProactivePrompt: ProactivePromptCandidate | null
  conversationMemory: ConversationMemoryState
  longTermMemories: LongTermMemoryRecord[]
  longTermMemoryStatus: LongTermMemoryStoreStatus
  longTermMemoryConsent: LongTermMemoryConsentSettings
  learnedCustomObjects: CustomObjectRecord[]
  selectedObjectRegion: VisionRegion | null
  conversationTelemetry: ConversationTelemetryRecord[]
  latencyMetrics: VoiceLatencyMetrics | null
  edgeCloudMetrics: { cloudInvocations: number }
  dailySpend: number
  onToggleExpanded: () => void
  onTranscriptChange: (value: string) => void
  onProcessTranscript: () => void
  onSimulateWeakNetwork: () => void
  onUndoTeaching: () => void
  onToggleDebugEvidence: (enabled: boolean) => void
}

export function DebugPanel({
  language,
  expanded,
  transcript,
  showDebugEvidence,
  mediaState,
  networkState,
  samplingMode,
  speechState,
  cloudProviderKind,
  proactivePromptState,
  proactiveDetectorStatus,
  lastCommand,
  lastDialogueEvent,
  lastFrame,
  lastVisualAnswer,
  activeVisualEvidence,
  lastLocalVision,
  lastProactivePrompt,
  conversationMemory,
  longTermMemories,
  longTermMemoryStatus,
  longTermMemoryConsent,
  learnedCustomObjects,
  selectedObjectRegion,
  conversationTelemetry,
  latencyMetrics,
  edgeCloudMetrics,
  dailySpend,
  onToggleExpanded,
  onTranscriptChange,
  onProcessTranscript,
  onSimulateWeakNetwork,
  onUndoTeaching,
  onToggleDebugEvidence,
}: DebugPanelProps) {
  const text = getMessages(language)

  return (
    <section className="debug-panel">
      <button type="button" className="debug-panel__toggle" onClick={onToggleExpanded}>
        {expanded ? text.hideDebug : text.showDebug}
      </button>

      {expanded && (
        <div className="debug-panel__content">
          <div className="control-card">
            <h2>{text.runtimeState}</h2>
            <dl className="state-grid">
              <div>
                <dt>Media</dt>
                <dd>{mediaState.status}</dd>
              </div>
              <div>
                <dt>Camera</dt>
                <dd>{mediaState.cameraStatus}</dd>
              </div>
              <div>
                <dt>Microphone</dt>
                <dd>{mediaState.microphoneStatus}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{networkState}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{language}</dd>
              </div>
              <div>
                <dt>Sampling</dt>
                <dd>{samplingMode}</dd>
              </div>
              <div>
                <dt>Speech</dt>
                <dd>{speechState.status}</dd>
              </div>
              <div>
                <dt>TTS provider</dt>
                <dd>{speechState.provider ?? 'none'}</dd>
              </div>
              <div>
                <dt>Cloud VLM</dt>
                <dd>
                  {cloudProviderKind === 'backend'
                    ? 'backend+Qwen3-VL-8B-Thinking'
                    : cloudProviderKind === 'qwen'
                      ? 'Qwen3-VL-8B-Thinking'
                      : 'mock'}
                </dd>
              </div>
              <div>
                <dt>Proactive prompts</dt>
                <dd>{proactivePromptState.settings.enabled ? 'on' : 'off'}</dd>
              </div>
              <div>
                <dt>Proactive detector</dt>
                <dd>{proactiveDetectorStatus}</dd>
              </div>
            </dl>

            <div className="transcript-box">
              <label htmlFor="transcript">{text.transcriptSimulator}</label>
              <input
                id="transcript"
                value={transcript}
                onChange={(event) => onTranscriptChange(event.target.value)}
                placeholder={text.transcriptPlaceholder}
              />
            </div>

            <div className="button-row">
              <button type="button" onClick={onProcessTranscript}>
                {text.processTranscript}
              </button>
              <button type="button" onClick={onUndoTeaching}>
                {text.undoTeaching}
              </button>
              <button type="button" onClick={onSimulateWeakNetwork}>
                {text.simulateWeakNetwork}
              </button>
            </div>

            {mediaState.errorMessage && <p className="warning">{mediaState.errorMessage}</p>}
          </div>

          <section className="event-log">
            <h2>{text.localProcessing}</h2>
            <div className="event-grid">
              <article>
                <h3>{text.lastLocalCommand}</h3>
                <p>{lastCommand ? `${lastCommand.command.id} (${lastCommand.phrase})` : 'None'}</p>
              </article>
              <article>
                <h3>{text.lastDialogueEvent}</h3>
                <p>
                  {lastDialogueEvent
                    ? `${lastDialogueEvent.trigger}${lastDialogueEvent.transcript ? `: ${lastDialogueEvent.transcript}` : ''}`
                    : 'None'}
                </p>
              </article>
              <article>
                <h3>{text.lastAiFrame}</h3>
                <p>
                  {lastFrame
                    ? `${lastFrame.width}x${lastFrame.height}, ${lastFrame.mode}, ${new Date(
                        lastFrame.capturedAt,
                      ).toLocaleTimeString()}`
                    : text.waitingForFrame}
                </p>
              </article>
              <article>
                <h3>{text.visualAnswer}</h3>
                <p>
                  {lastVisualAnswer
                    ? `${lastVisualAnswer.source}/${lastVisualAnswer.kind}: ${lastVisualAnswer.answer}`
                    : 'None'}
                </p>
              </article>
              <article>
                <h3>{text.localVision}</h3>
                <p>
                  {lastLocalVision
                    ? `Objects: ${lastLocalVision.objectCandidates.length}, scenes: ${lastLocalVision.sceneCandidates.length}, gestures: ${lastLocalVision.gestures.length}`
                    : text.noAnalysisYet}
                </p>
              </article>
              <article>
                <h3>{text.proactivePrompts}</h3>
                <p>
                  {`Daily ${proactivePromptState.counters.dailyCount}/${proactivePromptState.settings.dailyCap}, intensity: ${proactivePromptState.settings.reminderIntensity}, storage: ${
                    proactivePromptState.storageAvailable ? 'available' : 'unavailable'
                  }`}
                </p>
                <p>
                  {lastProactivePrompt
                    ? `${lastProactivePrompt.source}/${lastProactivePrompt.ruleId}: ${lastProactivePrompt.text}`
                    : 'None'}
                </p>
              </article>
              <article>
                <h3>{text.memory}</h3>
                <p>
                  {conversationMemory.entries.length > 0
                    ? conversationMemory.entries.map((entry) => `${entry.kind}:${entry.label}`).join(', ')
                    : text.noVisualContext}
                </p>
              </article>
              <article>
                <h3>{text.longTermMemoryTitle}</h3>
                <p>
                  {longTermMemoryStatus.available
                    ? `${longTermMemories.length} local encrypted memories, cloud access: ${
                        longTermMemoryConsent.cloudMemoryAccess ? 'authorized' : 'off'
                      }, summary sync: ${longTermMemoryConsent.cloudSummarySync ? 'on' : 'off'}`
                    : longTermMemoryStatus.message ?? text.longTermMemoryUnavailable}
                </p>
              </article>
              <article>
                <h3>{text.visualEvidence}</h3>
                <p>
                  {activeVisualEvidence?.evidenceAvailable
                    ? activeVisualEvidence.explanation ?? text.highlightActive
                    : text.noVisualEvidence}
                </p>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={showDebugEvidence}
                    onChange={(event) => onToggleDebugEvidence(event.target.checked)}
                  />
                  <span>{text.showDebugCoordinates}</span>
                </label>
                {showDebugEvidence && (
                  <p>
                    {lastVisualAnswer?.regions.length
                      ? lastVisualAnswer.regions
                          .map(
                            (region) =>
                              `${region.label ?? 'region'} (${region.x}, ${region.y}, ${region.width}, ${region.height})`,
                          )
                          .join(', ')
                      : text.noRegions}
                  </p>
                )}
              </article>
              <article>
                <h3>{text.selectedObjectRegion}</h3>
                <p>
                  {selectedObjectRegion
                    ? `${selectedObjectRegion.x.toFixed(2)}, ${selectedObjectRegion.y.toFixed(
                        2,
                      )}, ${selectedObjectRegion.width.toFixed(2)}, ${selectedObjectRegion.height.toFixed(2)}`
                    : text.noSelectedRegion}
                </p>
              </article>
              <article>
                <h3>{text.debugTelemetry}</h3>
                <p>
                  Daily spend: ${dailySpend.toFixed(4)} | Cloud reduction:{' '}
                  {Math.round((1 - edgeCloudMetrics.cloudInvocations / 10) * 100)}%
                </p>
                {conversationTelemetry.length > 0 ? (
                  <ul className="learned-list">
                    {conversationTelemetry.map((record) => (
                      <li key={record.conversationId}>
                        <span>
                          {record.conversationId}: {record.estimatedTokens} est / {record.actualTokens ?? 0} actual
                          tokens, ${record.estimatedCost.toFixed(4)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{text.noTelemetry}</p>
                )}
              </article>
              <article>
                <h3>{text.speechOutput}</h3>
                <p>
                  {speechState.status}
                  {speechState.provider ? ` via ${speechState.provider}` : ''}
                  {speechState.fallbackUsed ? ' (fallback)' : ''}
                  {speechState.errorMessage ? `: ${speechState.errorMessage}` : ''}
                </p>
              </article>
              <article>
                <h3>{text.latency}</h3>
                <p>
                  {latencyMetrics?.responseLatencyMs !== undefined
                    ? `${latencyMetrics.responseLatencyMs}ms, <3s: ${
                        latencyMetrics.metThreeSecondRequirement ? 'yes' : 'no'
                      }, <2.5s target: ${latencyMetrics.metTwoPointFiveSecondTarget ? 'yes' : 'no'}`
                    : text.noLatency}
                </p>
              </article>
              <article>
                <h3>{text.learnedObjectsTitle}</h3>
                <p>{learnedCustomObjects.length > 0 ? learnedCustomObjects.map((o) => o.name).join(', ') : text.noCustomObjects}</p>
              </article>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
