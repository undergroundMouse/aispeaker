import type { RefObject } from 'react'
import type { ActiveVisualEvidence, AppLanguage, AsrCaptureState, VisionRegion } from '../../types'
import type { CameraInteractionFeedback } from './presentationTypes'
import type { ConversationTurn } from './presentationTypes'
import type { ProactiveBannerState } from './presentationTypes'
import type { SystemToastState } from './presentationTypes'
import { AmbientChrome } from './AmbientChrome'
import { CameraStage } from './CameraStage'
import { DialoguePanel } from './DialoguePanel'
import { SystemToast } from './SystemToast'
import { TalkControls } from './TalkControls'
import { getMessages } from '../../i18n'

export interface AssistShellProps {
  language: AppLanguage
  videoRef: RefObject<HTMLVideoElement | null>
  cameraStream: MediaStream | null
  cameraStatus: string
  mediaStatus: string
  microphoneStatus: string
  networkState: string
  speechStatus: string
  asrState: AsrCaptureState
  activeVisualEvidence: ActiveVisualEvidence | null
  selectedObjectRegion: VisionRegion | null
  captionTurns: ConversationTurn[]
  proactiveBanner: ProactiveBannerState
  systemToast: SystemToastState
  memoryBadgeCount: number
  interactionFeedback: CameraInteractionFeedback
  isPushToTalkActive: boolean
  chatInputText: string
  onChatInputChange: (value: string) => void
  onChatInputSubmit: () => void
  onDismissSystemToast: () => void
  onOpenMemory: () => void
  onOpenSettings: () => void
  onOpenPrivacySettings: () => void
  onSelectFromPointer: (clientX: number, clientY: number) => void
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
  onSelectCenteredObject: () => void
  onClearSelectedObject: () => void
}

export function AssistShell({
  language,
  videoRef,
  cameraStream,
  cameraStatus,
  mediaStatus,
  microphoneStatus,
  networkState,
  speechStatus,
  asrState,
  activeVisualEvidence,
  selectedObjectRegion,
  captionTurns,
  proactiveBanner,
  systemToast,
  memoryBadgeCount,
  interactionFeedback,
  isPushToTalkActive,
  chatInputText,
  onChatInputChange,
  onChatInputSubmit,
  onDismissSystemToast,
  onOpenMemory,
  onOpenSettings,
  onOpenPrivacySettings,
  onSelectFromPointer,
  onStartPushToTalk,
  onStopPushToTalk,
  onSelectCenteredObject,
  onClearSelectedObject,
}: AssistShellProps) {
  const text = getMessages(language)
  const cameraLabel = language === 'zh' ? '视觉' : 'Vision'
  const microphoneLabel = language === 'zh' ? '麦克风' : 'Mic'

  return (
    <section className="assist-shell assist-shell--split">
      <AmbientChrome
        language={language}
        networkState={networkState}
        memoryBadgeCount={memoryBadgeCount}
        onOpenMemory={onOpenMemory}
        onOpenSettings={onOpenSettings}
      />

      <div className="assist-split-layout">
        <div className="vision-column">
          <section className="vision-hero" aria-labelledby="vision-hero-title">
            <div>
              <p className="vision-hero__eyebrow">{text.statusCloud}</p>
              <h1 id="vision-hero-title" className="vision-hero__title">
                {text.title}
              </h1>
              <p className="vision-hero__subtitle">{text.subtitle}</p>
            </div>
            <div className="vision-hero__status" aria-label={text.statusNetwork}>
              <span className={`vision-status-chip vision-status-chip--${networkState}`}>
                {text.statusNetwork}: {networkState}
              </span>
              <span className={`vision-status-chip vision-status-chip--${mediaStatus}`}>
                {cameraLabel}: {cameraStatus}
              </span>
              <span className={`vision-status-chip vision-status-chip--${microphoneStatus}`}>
                {microphoneLabel}: {microphoneStatus}
              </span>
            </div>
          </section>
          <CameraStage
            language={language}
            videoRef={videoRef}
            cameraStream={cameraStream}
            mediaStatus={mediaStatus}
            cameraStatus={cameraStatus}
            activeVisualEvidence={activeVisualEvidence}
            selectedObjectRegion={selectedObjectRegion}
            interactionFeedback={interactionFeedback}
            onSelectFromPointer={onSelectFromPointer}
          />
          <TalkControls
            language={language}
            hasSelectedRegion={Boolean(selectedObjectRegion)}
            onSelectCenteredObject={onSelectCenteredObject}
            onClearSelectedObject={onClearSelectedObject}
          />
          <SystemToast toast={systemToast} onDismiss={onDismissSystemToast} />
        </div>

        <DialoguePanel
          language={language}
          asrState={asrState}
          isPushToTalkActive={isPushToTalkActive}
          speechStatus={speechStatus}
          captionTurns={captionTurns}
          proactiveBanner={proactiveBanner}
          chatInputText={chatInputText}
          microphoneReady={microphoneStatus === 'ready'}
          onChatInputChange={onChatInputChange}
          onChatInputSubmit={onChatInputSubmit}
          onStartPushToTalk={onStartPushToTalk}
          onStopPushToTalk={onStopPushToTalk}
          onOpenPrivacySettings={onOpenPrivacySettings}
        />
      </div>
    </section>
  )
}
