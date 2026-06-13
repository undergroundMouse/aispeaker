import type { RefObject } from 'react'
import type { ConversationEntry } from '../conversationEntry'
import type { ActiveVisualEvidence, AppLanguage, VisionRegion } from '../../types'
import { CameraStage } from './CameraStage'
import { ConversationStrip } from './ConversationStrip'
import { StatusBar } from './StatusBar'
import { TalkControls } from './TalkControls'
import { getMessages } from '../../i18n'

export interface AssistShellProps {
  language: AppLanguage
  videoRef: RefObject<HTMLVideoElement | null>
  cameraStatus: string
  microphoneStatus: string
  networkState: string
  cloudProviderKind: string
  proactiveEnabled: boolean
  speechStatus: string
  operatorAvailable: boolean
  activeVisualEvidence: ActiveVisualEvidence | null
  selectedObjectRegion: VisionRegion | null
  conversationEntries: ConversationEntry[]
  isPushToTalkActive: boolean
  warnings: string[]
  onOpenSettings: () => void
  onOpenOperator: () => void
  onSelectFromPointer: (clientX: number, clientY: number) => void
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
  onSelectCenteredObject: () => void
}

export function AssistShell({
  language,
  videoRef,
  cameraStatus,
  microphoneStatus,
  networkState,
  cloudProviderKind,
  proactiveEnabled,
  speechStatus,
  operatorAvailable,
  activeVisualEvidence,
  selectedObjectRegion,
  conversationEntries,
  isPushToTalkActive,
  warnings,
  onOpenSettings,
  onOpenOperator,
  onSelectFromPointer,
  onStartPushToTalk,
  onStopPushToTalk,
  onSelectCenteredObject,
}: AssistShellProps) {
  const text = getMessages(language)

  return (
    <section className="assist-shell">
      <div className="hero-panel hero-panel--compact">
        <p className="eyebrow">Assist</p>
        <h1>{text.title}</h1>
        <p className="subtitle">{text.subtitle}</p>
      </div>

      <StatusBar
        language={language}
        networkState={networkState}
        cloudProviderKind={cloudProviderKind}
        proactiveEnabled={proactiveEnabled}
        speechStatus={speechStatus}
        operatorAvailable={operatorAvailable}
        onOpenSettings={onOpenSettings}
        onOpenOperator={onOpenOperator}
      />

      <div className="assist-layout">
        <CameraStage
          language={language}
          videoRef={videoRef}
          cameraStatus={cameraStatus}
          activeVisualEvidence={activeVisualEvidence}
          selectedObjectRegion={selectedObjectRegion}
          onSelectFromPointer={onSelectFromPointer}
        />

        <div className="assist-side">
          <ConversationStrip language={language} entries={conversationEntries} />
          <TalkControls
            language={language}
            isPushToTalkActive={isPushToTalkActive}
            microphoneReady={microphoneStatus === 'ready'}
            hasSelectedRegion={Boolean(selectedObjectRegion)}
            onStartPushToTalk={onStartPushToTalk}
            onStopPushToTalk={onStopPushToTalk}
            onSelectCenteredObject={onSelectCenteredObject}
          />
          {warnings.map((warning) => (
            <p key={warning} className="warning">
              {warning}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
