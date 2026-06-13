import './App.css'
import { useMemo, useState } from 'react'
import { VisualEvidenceOverlay } from './components/VisualEvidenceOverlay'
import { useRealtimeVisionVoice } from './hooks/useRealtimeVisionVoice'
import { getMessages } from './i18n'

function App() {
  const [transcript, setTranscript] = useState('你好')
  const [showDebugEvidence, setShowDebugEvidence] = useState(false)
  const {
    videoRef,
    mediaState,
    language,
    networkState,
    watchOnly,
    samplingMode,
    isPushToTalkActive,
    lastCommand,
    lastDialogueEvent,
    lastFrame,
    lastVisualAnswer,
    activeVisualEvidence,
    lastLocalVision,
    proactivePromptState,
    lastProactivePrompt,
    proactiveDetectorStatus,
    selectedObjectRegion,
    learnedCustomObjects,
    longTermMemories,
    staleLongTermMemories,
    longTermMemoryStatus,
    longTermMemoryConsent,
    conversationMemory,
    feedback,
    speechState,
    latencyMetrics,
    setWatchOnly,
    startPushToTalk,
    stopPushToTalk,
    handleTranscript,
    selectCenteredObjectRegion,
    selectObjectRegionFromPointer,
    deleteLearnedCustomObject,
    undoLastTeaching,
    deleteLongTermMemory,
    forgetAllLongTermMemories,
    setCloudMemoryAccess,
    setCloudSummarySync,
    setCameraCaptureConsent,
    setMicrophoneCaptureConsent,
    setCloudMediaTransmissionConsent,
    setDailyBudgetCap,
    mediaPrivacyConsent,
    conversationTelemetry,
    getDailySpend,
    exportLongTermMemoriesToFile,
    exportCustomObjectsToFile,
    markCloudRequestFailed,
  } = useRealtimeVisionVoice()
  const text = useMemo(() => getMessages(language), [language])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">FR-01 - FR-08 Prototype</p>
        <h1>{text.title}</h1>
        <p className="subtitle">{text.subtitle}</p>
      </section>

      <section className="dashboard">
        <div className="preview-card">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="preview-video"
            onClick={(event) => selectObjectRegionFromPointer(event.clientX, event.clientY)}
          />
          <VisualEvidenceOverlay
            regions={activeVisualEvidence?.regions ?? []}
            visible={Boolean(activeVisualEvidence?.evidenceAvailable)}
          />
          {selectedObjectRegion && (
            <div
              className="selection-box"
              style={{
                left: `${selectedObjectRegion.x * 100}%`,
                top: `${selectedObjectRegion.y * 100}%`,
                width: `${selectedObjectRegion.width * 100}%`,
                height: `${selectedObjectRegion.height * 100}%`,
              }}
            />
          )}
          {mediaState.cameraStatus !== 'ready' && (
            <div className="preview-empty">{text.cameraUnavailable}</div>
          )}
        </div>

        <div className="control-card">
          <h2>Runtime State</h2>
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
              <dt>Proactive prompts</dt>
              <dd>{proactivePromptState.settings.enabled ? 'on' : 'off'}</dd>
            </div>
            <div>
              <dt>Proactive detector</dt>
              <dd>{proactiveDetectorStatus}</dd>
            </div>
          </dl>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={watchOnly}
              onChange={(event) => setWatchOnly(event.target.checked)}
            />
            {text.watchOnly}
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={longTermMemoryConsent.cloudMemoryAccess}
              onChange={(event) => setCloudMemoryAccess(event.target.checked)}
            />
            Allow cloud access to relevant long-term memory
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={longTermMemoryConsent.cloudSummarySync}
              onChange={(event) => setCloudSummarySync(event.target.checked)}
            />
            Enable summary-only cloud memory sync
          </label>

          <h3>Media privacy</h3>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.cameraCapture}
              onChange={(event) => setCameraCaptureConsent(event.target.checked)}
            />
            Authorize camera capture
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.microphoneCapture}
              onChange={(event) => setMicrophoneCaptureConsent(event.target.checked)}
            />
            Authorize microphone capture
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={mediaPrivacyConsent.cloudMediaTransmission}
              onChange={(event) => setCloudMediaTransmissionConsent(event.target.checked)}
            />
            Authorize cloud media transmission
          </label>

          <div className="transcript-box">
            <label htmlFor="transcript">Voice transcript simulator</label>
            <input
              id="transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="你好 / stop / take photo / switch to English"
            />
          </div>

          <div className="button-row">
            <button
              type="button"
              onMouseDown={startPushToTalk}
              onMouseUp={() => stopPushToTalk(transcript)}
              disabled={mediaState.microphoneStatus !== 'ready'}
            >
              {isPushToTalkActive ? text.stopPushToTalk : text.startPushToTalk}
            </button>
            <button type="button" onClick={() => handleTranscript(transcript)}>
              Process transcript
            </button>
            <button type="button" onClick={selectCenteredObjectRegion}>
              Select center object
            </button>
            <button type="button" onClick={undoLastTeaching}>
              Undo teaching
            </button>
            <button type="button" onClick={markCloudRequestFailed}>
              Simulate weak network
            </button>
          </div>

          <p className="feedback">{feedback}</p>
          {mediaState.errorMessage && <p className="warning">{mediaState.errorMessage}</p>}
          {!longTermMemoryStatus.available && (
            <p className="warning">{longTermMemoryStatus.message ?? 'Local long-term memory is unavailable.'}</p>
          )}
          {staleLongTermMemories.length > 0 && (
            <p className="warning">
              {staleLongTermMemories.length} long-term memories need review after 30 days without use.
            </p>
          )}
        </div>
      </section>

      <section className="event-log">
        <h2>Local Processing</h2>
        <div className="event-grid">
          <article>
            <h3>Last local command</h3>
            <p>{lastCommand ? `${lastCommand.command.id} (${lastCommand.phrase})` : 'None'}</p>
          </article>
          <article>
            <h3>Last dialogue event</h3>
            <p>
              {lastDialogueEvent
                ? `${lastDialogueEvent.trigger}${lastDialogueEvent.transcript ? `: ${lastDialogueEvent.transcript}` : ''}`
                : 'None'}
            </p>
          </article>
          <article>
            <h3>Last AI frame</h3>
            <p>
              {lastFrame
                ? `${lastFrame.width}x${lastFrame.height}, ${lastFrame.mode}, ${new Date(
                    lastFrame.capturedAt,
                  ).toLocaleTimeString()}`
                : 'Waiting for camera frame'}
            </p>
          </article>
          <article>
            <h3>Visual answer</h3>
            <p>
              {lastVisualAnswer
                ? `${lastVisualAnswer.source}/${lastVisualAnswer.kind}: ${lastVisualAnswer.answer}`
                : 'None'}
            </p>
          </article>
          <article>
            <h3>Local vision</h3>
            <p>
              {lastLocalVision
                ? `Objects: ${lastLocalVision.objectCandidates.length}, scenes: ${lastLocalVision.sceneCandidates.length}, gestures: ${lastLocalVision.gestures.length}`
                : 'No analysis yet'}
            </p>
          </article>
          <article>
            <h3>Proactive prompts</h3>
            <p>
              {`Daily ${proactivePromptState.counters.dailyCount}/${proactivePromptState.settings.dailyCap}, intensity: ${proactivePromptState.settings.reminderIntensity}, storage: ${
                proactivePromptState.storageAvailable ? 'available' : 'unavailable'
              }`}
            </p>
            <p>{lastProactivePrompt ? `${lastProactivePrompt.source}/${lastProactivePrompt.ruleId}: ${lastProactivePrompt.text}` : 'None'}</p>
          </article>
          <article>
            <h3>Memory</h3>
            <p>
              {conversationMemory.entries.length > 0
                ? conversationMemory.entries.map((entry) => `${entry.kind}:${entry.label}`).join(', ')
                : 'No visual context remembered'}
            </p>
          </article>
          <article>
            <h3>Long-term memory</h3>
            <p>
              {longTermMemoryStatus.available
                ? `${longTermMemories.length} local encrypted memories, cloud access: ${
                    longTermMemoryConsent.cloudMemoryAccess ? 'authorized' : 'off'
                  }, summary sync: ${longTermMemoryConsent.cloudSummarySync ? 'on' : 'off'}`
                : longTermMemoryStatus.message ?? 'Local long-term memory unavailable'}
            </p>
            <button type="button" onClick={forgetAllLongTermMemories} disabled={longTermMemories.length === 0}>
              Forget all long-term memories
            </button>
            <button type="button" onClick={exportLongTermMemoriesToFile} disabled={longTermMemories.length === 0}>
              Export long-term memories
            </button>
            {longTermMemories.length > 0 ? (
              <ul className="learned-list memory-list">
                {longTermMemories.map((memory) => (
                  <li key={memory.id}>
                    <span>
                      {memory.summary}
                      <small>
                        {memory.type}, last used {new Date(memory.lastUsedAt).toLocaleDateString()}
                        {memory.weakenedAt ? ', weakened' : ''}
                      </small>
                    </span>
                    <button type="button" onClick={() => deleteLongTermMemory(memory.id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No long-term memories stored</p>
            )}
          </article>
          <article>
            <h3>Visual evidence</h3>
            <p>
              {activeVisualEvidence?.evidenceAvailable
                ? activeVisualEvidence.explanation ?? 'Highlight active on preview.'
                : 'No active visual evidence'}
            </p>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={showDebugEvidence}
                onChange={(event) => setShowDebugEvidence(event.target.checked)}
              />
              <span>Show debug coordinates</span>
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
                  : 'No regions available'}
              </p>
            )}
          </article>
          <article>
            <h3>Selected object region</h3>
            <p>
              {selectedObjectRegion
                ? `${selectedObjectRegion.x.toFixed(2)}, ${selectedObjectRegion.y.toFixed(
                    2,
                  )}, ${selectedObjectRegion.width.toFixed(2)}, ${selectedObjectRegion.height.toFixed(2)}`
                : 'No selected object region'}
            </p>
          </article>
          <article>
            <h3>Learned custom objects</h3>
            <button type="button" onClick={exportCustomObjectsToFile} disabled={learnedCustomObjects.length === 0}>
              Export learned objects
            </button>
            {learnedCustomObjects.length > 0 ? (
              <ul className="learned-list">
                {learnedCustomObjects.map((object) => (
                  <li key={object.id}>
                    <span>{object.name}</span>
                    <button type="button" onClick={() => deleteLearnedCustomObject(object.id)}>
                      Forget
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No custom objects learned</p>
            )}
          </article>
          <article>
            <h3>Operations admin</h3>
            <p>Daily spend: ${getDailySpend().toFixed(4)}</p>
            <button type="button" onClick={() => setDailyBudgetCap(0.01)}>
              Set daily budget cap to $0.01
            </button>
            <button type="button" onClick={() => setDailyBudgetCap(null)}>
              Clear daily budget cap
            </button>
            {conversationTelemetry.length > 0 ? (
              <ul className="learned-list">
                {conversationTelemetry.map((record) => (
                  <li key={record.conversationId}>
                    <span>
                      {record.conversationId}: {record.estimatedTokens} est / {record.actualTokens ?? 0} actual tokens,
                      ${record.estimatedCost.toFixed(4)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No conversation telemetry yet</p>
            )}
          </article>
          <article>
            <h3>Speech output</h3>
            <p>
              {speechState.status}
              {speechState.provider ? ` via ${speechState.provider}` : ''}
              {speechState.fallbackUsed ? ' (fallback)' : ''}
              {speechState.errorMessage ? `: ${speechState.errorMessage}` : ''}
            </p>
          </article>
          <article>
            <h3>Latency</h3>
            <p>
              {latencyMetrics?.responseLatencyMs !== undefined
                ? `${latencyMetrics.responseLatencyMs}ms, <3s: ${
                    latencyMetrics.metThreeSecondRequirement ? 'yes' : 'no'
                  }, <2.5s target: ${latencyMetrics.metTwoPointFiveSecondTarget ? 'yes' : 'no'}`
                : 'No voice latency measured'}
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
