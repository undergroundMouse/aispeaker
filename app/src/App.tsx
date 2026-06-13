import './App.css'
import { useMemo, useState } from 'react'
import { useRealtimeVisionVoice } from './hooks/useRealtimeVisionVoice'
import { getMessages } from './i18n'
import { AssistShell } from './surfaces/assist/AssistShell'
import { buildConversationEntries } from './surfaces/conversationEntry'
import { DebugPanel } from './surfaces/debug/DebugPanel'
import { OperatorDashboard } from './surfaces/operator/OperatorDashboard'
import { isDebugMode, isOperatorAvailable, navigateToRoute } from './surfaces/routing'
import { SettingsDrawer } from './surfaces/settings/SettingsDrawer'
import { useAppRoute } from './surfaces/useAppRoute'

function App() {
  const [transcript, setTranscript] = useState('你好')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showDebugEvidence, setShowDebugEvidence] = useState(false)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const route = useAppRoute()
  const operatorAvailable = isOperatorAvailable()
  const debugEnabled = isDebugMode()

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
    edgeCloudMetrics,
    conversationTelemetry,
    cloudProviderKind,
    exportLongTermMemoriesToFile,
    exportCustomObjectsToFile,
    getDailySpend,
    markCloudRequestFailed,
  } = useRealtimeVisionVoice()

  const text = useMemo(() => getMessages(language), [language])

  const conversationEntries = useMemo(
    () =>
      buildConversationEntries({
        feedback,
        lastVisualAnswer,
        lastProactivePrompt,
        lastDialogueEvent,
        language,
      }),
    [feedback, lastDialogueEvent, lastProactivePrompt, lastVisualAnswer, language],
  )

  const assistWarnings = useMemo(() => {
    const warnings: string[] = []
    if (!longTermMemoryStatus.available) {
      warnings.push(longTermMemoryStatus.message ?? text.longTermMemoryUnavailable)
    }
    if (staleLongTermMemories.length > 0) {
      warnings.push(text.staleMemoryWarning(staleLongTermMemories.length))
    }
    return warnings
  }, [longTermMemoryStatus, staleLongTermMemories.length, text])

  if (route === 'admin' && operatorAvailable) {
    return (
      <OperatorDashboard
        language={language}
        dailySpend={getDailySpend()}
        cloudReductionPercent={Math.round((1 - edgeCloudMetrics.cloudInvocations / 10) * 100)}
        conversationTelemetry={conversationTelemetry}
        onBack={() => navigateToRoute('assist')}
        onSetBudgetCap={(cap) => setDailyBudgetCap(cap)}
        onClearBudgetCap={() => setDailyBudgetCap(null)}
      />
    )
  }

  return (
    <main className="app-shell">
      <AssistShell
        language={language}
        videoRef={videoRef}
        cameraStatus={mediaState.cameraStatus}
        microphoneStatus={mediaState.microphoneStatus}
        networkState={networkState}
        cloudProviderKind={cloudProviderKind}
        proactiveEnabled={proactivePromptState.settings.enabled}
        speechStatus={speechState.status}
        operatorAvailable={operatorAvailable}
        activeVisualEvidence={activeVisualEvidence}
        selectedObjectRegion={selectedObjectRegion}
        conversationEntries={conversationEntries}
        isPushToTalkActive={isPushToTalkActive}
        warnings={assistWarnings}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenOperator={() => navigateToRoute('admin')}
        onSelectFromPointer={selectObjectRegionFromPointer}
        onStartPushToTalk={startPushToTalk}
        onStopPushToTalk={() => stopPushToTalk(transcript)}
        onSelectCenteredObject={selectCenteredObjectRegion}
      />

      {settingsOpen && (
        <SettingsDrawer
          language={language}
          watchOnly={watchOnly}
          mediaPrivacyConsent={mediaPrivacyConsent}
          longTermMemoryConsent={longTermMemoryConsent}
          longTermMemoryStatus={longTermMemoryStatus}
          learnedCustomObjects={learnedCustomObjects}
          longTermMemories={longTermMemories}
          staleLongTermCount={staleLongTermMemories.length}
          onClose={() => setSettingsOpen(false)}
          onWatchOnlyChange={setWatchOnly}
          onCameraConsentChange={setCameraCaptureConsent}
          onMicrophoneConsentChange={setMicrophoneCaptureConsent}
          onCloudMediaConsentChange={setCloudMediaTransmissionConsent}
          onCloudMemoryAccessChange={setCloudMemoryAccess}
          onCloudSummarySyncChange={setCloudSummarySync}
          onDeleteCustomObject={deleteLearnedCustomObject}
          onExportCustomObjects={exportCustomObjectsToFile}
          onDeleteLongTermMemory={deleteLongTermMemory}
          onForgetAllLongTermMemories={forgetAllLongTermMemories}
          onExportLongTermMemories={exportLongTermMemoriesToFile}
        />
      )}

      {debugEnabled && (
        <DebugPanel
          language={language}
          expanded={debugExpanded}
          transcript={transcript}
          showDebugEvidence={showDebugEvidence}
          mediaState={mediaState}
          networkState={networkState}
          samplingMode={samplingMode}
          speechState={speechState}
          cloudProviderKind={cloudProviderKind}
          proactivePromptState={proactivePromptState}
          proactiveDetectorStatus={proactiveDetectorStatus}
          lastCommand={lastCommand}
          lastDialogueEvent={lastDialogueEvent}
          lastFrame={lastFrame}
          lastVisualAnswer={lastVisualAnswer}
          activeVisualEvidence={activeVisualEvidence}
          lastLocalVision={lastLocalVision}
          lastProactivePrompt={lastProactivePrompt}
          conversationMemory={conversationMemory}
          longTermMemories={longTermMemories}
          longTermMemoryStatus={longTermMemoryStatus}
          longTermMemoryConsent={longTermMemoryConsent}
          learnedCustomObjects={learnedCustomObjects}
          selectedObjectRegion={selectedObjectRegion}
          conversationTelemetry={conversationTelemetry}
          latencyMetrics={latencyMetrics}
          edgeCloudMetrics={edgeCloudMetrics}
          dailySpend={getDailySpend()}
          onToggleExpanded={() => setDebugExpanded((value) => !value)}
          onTranscriptChange={setTranscript}
          onProcessTranscript={() => handleTranscript(transcript)}
          onSimulateWeakNetwork={markCloudRequestFailed}
          onUndoTeaching={undoLastTeaching}
          onToggleDebugEvidence={setShowDebugEvidence}
        />
      )}
    </main>
  )
}

export default App
