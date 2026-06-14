import './App.css'
import { useMemo, useState } from 'react'
import { useRealtimeVisionVoice } from './hooks/useRealtimeVisionVoice'
import { AssistShell } from './surfaces/assist/AssistShell'
import { detectCameraInteractionFeedback } from './surfaces/assist/detectCameraInteractionFeedback'
import { useAssistPresentation } from './surfaces/assist/useAssistPresentation'
import { MemoryPage } from './surfaces/memory/MemoryPage'
import { OperatorDashboard } from './surfaces/operator/OperatorDashboard'
import { isOperatorAvailable, navigateToRoute } from './surfaces/routing'
import { SettingsDrawer, type SettingsFocusSection } from './surfaces/settings/SettingsDrawer'
import { useAppRoute } from './surfaces/useAppRoute'

function App() {
  const [chatInputText, setChatInputText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsFocusSection, setSettingsFocusSection] = useState<SettingsFocusSection>(null)
  const route = useAppRoute()
  const operatorAvailable = isOperatorAvailable()

  const {
    videoRef,
    mediaState,
    language,
    networkState,
    watchOnly,
    isPushToTalkActive,
    lastVisualAnswer,
    lastDialogueEvent,
    activeVisualEvidence,
    lastProactivePrompt,
    selectedObjectRegion,
    learnedCustomObjects,
    longTermMemories,
    staleLongTermMemories,
    longTermMemoryStatus,
    longTermMemoryConsent,
    feedback,
    dialogueSegments,
    asrState,
    speechState,
    setWatchOnly,
    startPushToTalk,
    stopPushToTalk,
    handleTranscript,
    selectCenteredObjectRegion,
    clearSelectedObjectRegion,
    selectObjectRegionFromPointer,
    deleteLearnedCustomObject,
    deleteLongTermMemory,
    forgetAllLongTermMemories,
    setCloudMemoryAccess,
    setCloudSummarySync,
    setCameraCaptureConsent,
    setMicrophoneCaptureConsent,
    setCloudMediaTransmissionConsent,
    setHybridOmniDialogueEnabled,
    setOmniPureDialogueEnabled,
    setDailyBudgetCap,
    mediaPrivacyConsent,
    edgeCloudMetrics,
    conversationTelemetry,
    cloudProviderKind,
    exportLongTermMemoriesToFile,
    exportCustomObjectsToFile,
    getDailySpend,
    sessionStatus,
    omniSessionStatus,
    hybridVoicePath,
    omniFallbackReason,
    featureFlags,
  } = useRealtimeVisionVoice()

  const memoryBadgeCount = useMemo(() => {
    let count = 0
    if (!longTermMemoryStatus.available) {
      count += 1
    }
    if (staleLongTermMemories.length > 0) {
      count += 1
    }
    return count
  }, [longTermMemoryStatus.available, staleLongTermMemories.length])

  const { captionTurns, proactiveBanner, systemToast, dismissSystemToast } = useAssistPresentation({
    dialogueSegments,
    feedback,
    lastVisualAnswer,
    lastDialogueEvent,
    lastProactivePrompt,
    isPushToTalkActive,
    speechState,
    language,
  })

  const interactionFeedback = useMemo(
    () => detectCameraInteractionFeedback(feedback, language),
    [feedback, language],
  )

  const submitChatInput = () => {
    const trimmed = chatInputText.trim()
    if (!trimmed) {
      return
    }

    void handleTranscript(trimmed)
    setChatInputText('')
  }

  const openSettings = (focusSection: SettingsFocusSection = null) => {
    setSettingsFocusSection(focusSection)
    setSettingsOpen(true)
  }

  const closeSettings = () => {
    setSettingsOpen(false)
    setSettingsFocusSection(null)
  }

  if (route === 'admin' && operatorAvailable) {
    return (
      <OperatorDashboard
        language={language}
        cloudProviderKind={cloudProviderKind}
        dailySpend={getDailySpend()}
        cloudReductionPercent={Math.round((1 - edgeCloudMetrics.cloudInvocations / 10) * 100)}
        conversationTelemetry={conversationTelemetry}
        sessionStatus={sessionStatus}
        omniSessionStatus={omniSessionStatus}
        hybridVoicePath={hybridVoicePath}
        omniFallbackReason={omniFallbackReason}
        onBack={() => navigateToRoute('assist')}
        onSetBudgetCap={(cap) => setDailyBudgetCap(cap)}
        onClearBudgetCap={() => setDailyBudgetCap(null)}
      />
    )
  }

  if (route === 'memory') {
    return (
      <MemoryPage
        language={language}
        learnedCustomObjects={learnedCustomObjects}
        longTermMemories={longTermMemories}
        longTermMemoryStatus={longTermMemoryStatus}
        longTermMemoryConsent={longTermMemoryConsent}
        staleLongTermCount={staleLongTermMemories.length}
        onBack={() => navigateToRoute('assist')}
        onDeleteCustomObject={deleteLearnedCustomObject}
        onExportCustomObjects={exportCustomObjectsToFile}
        onDeleteLongTermMemory={deleteLongTermMemory}
        onForgetAllLongTermMemories={forgetAllLongTermMemories}
        onExportLongTermMemories={exportLongTermMemoriesToFile}
      />
    )
  }

  return (
    <>
      <main className="app-shell app-shell--assist">
        <AssistShell
          language={language}
          videoRef={videoRef}
          cameraStream={mediaState.cameraStream}
          cameraStatus={mediaState.cameraStatus}
          mediaStatus={mediaState.status}
          microphoneStatus={mediaState.microphoneStatus}
          networkState={networkState}
          speechStatus={speechState.status}
          asrState={asrState}
          activeVisualEvidence={activeVisualEvidence}
          selectedObjectRegion={selectedObjectRegion}
          captionTurns={captionTurns}
          proactiveBanner={proactiveBanner}
          systemToast={systemToast}
          memoryBadgeCount={memoryBadgeCount}
          interactionFeedback={interactionFeedback}
          isPushToTalkActive={isPushToTalkActive}
          chatInputText={chatInputText}
          onChatInputChange={setChatInputText}
          onChatInputSubmit={submitChatInput}
          onDismissSystemToast={dismissSystemToast}
          onOpenMemory={() => navigateToRoute('memory')}
          onOpenSettings={() => openSettings()}
          onOpenPrivacySettings={() => openSettings('privacy')}
          onSelectFromPointer={selectObjectRegionFromPointer}
          onStartPushToTalk={startPushToTalk}
          onStopPushToTalk={() => void stopPushToTalk()}
          onSelectCenteredObject={selectCenteredObjectRegion}
          onClearSelectedObject={clearSelectedObjectRegion}
        />
      </main>

      {settingsOpen && (
        <SettingsDrawer
          language={language}
          watchOnly={watchOnly}
          cameraStatus={mediaState.cameraStatus}
          microphoneStatus={mediaState.microphoneStatus}
          focusSection={settingsFocusSection}
          mediaPrivacyConsent={mediaPrivacyConsent}
          longTermMemoryConsent={longTermMemoryConsent}
          sessionStatus={sessionStatus}
          omniSessionStatus={omniSessionStatus}
          hybridOmniDialogueEnabled={featureFlags.hybridOmniDialogue}
          omniPureDialogueEnabled={featureFlags.omniPureDialogue}
          hybridOmniBuildEnabled={featureFlags.hybridOmniBuildEnabled}
          hybridVoicePath={hybridVoicePath}
          omniFallbackReason={omniFallbackReason}
          omniVlCorrectionMode={featureFlags.omniVlCorrectionMode}
          onHybridOmniDialogueChange={setHybridOmniDialogueEnabled}
          onOmniPureDialogueChange={setOmniPureDialogueEnabled}
          onClose={closeSettings}
          onWatchOnlyChange={setWatchOnly}
          onCameraConsentChange={setCameraCaptureConsent}
          onMicrophoneConsentChange={setMicrophoneCaptureConsent}
          onCloudMediaConsentChange={setCloudMediaTransmissionConsent}
          onCloudMemoryAccessChange={setCloudMemoryAccess}
          onCloudSummarySyncChange={setCloudSummarySync}
        />
      )}
    </>
  )
}

export default App
