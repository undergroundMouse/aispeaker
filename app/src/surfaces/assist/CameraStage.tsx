import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { VisualEvidenceOverlay } from '../../components/VisualEvidenceOverlay'
import type { ActiveVisualEvidence, AppLanguage, VisionRegion } from '../../types'
import type { CameraInteractionFeedback } from './presentationTypes'
import { getMessages } from '../../i18n'

export interface CameraStageProps {
  language: AppLanguage
  videoRef: RefObject<HTMLVideoElement | null>
  cameraStream: MediaStream | null
  mediaStatus: string
  cameraStatus: string
  activeVisualEvidence: ActiveVisualEvidence | null
  selectedObjectRegion: VisionRegion | null
  interactionFeedback: CameraInteractionFeedback
  onSelectFromPointer: (clientX: number, clientY: number) => void
}

export function CameraStage({
  language,
  videoRef,
  cameraStream,
  mediaStatus,
  cameraStatus,
  activeVisualEvidence,
  selectedObjectRegion,
  interactionFeedback,
  onSelectFromPointer,
}: CameraStageProps) {
  const text = getMessages(language)
  const [selectionAnimated, setSelectionAnimated] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream, videoRef])

  useEffect(() => {
    if (!selectedObjectRegion) {
      setSelectionAnimated(false)
      return
    }

    setSelectionAnimated(false)
    const frame = window.requestAnimationFrame(() => setSelectionAnimated(true))
    return () => window.cancelAnimationFrame(frame)
  }, [selectedObjectRegion])

  return (
    <div className="preview-card camera-stage">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="preview-video"
        onClick={(event) => onSelectFromPointer(event.clientX, event.clientY)}
      />
      <VisualEvidenceOverlay
        regions={activeVisualEvidence?.regions ?? []}
        visible={Boolean(activeVisualEvidence?.evidenceAvailable)}
      />
      {selectedObjectRegion && (
        <div
          className={['selection-box', selectionAnimated ? 'selection-box--animated' : ''].filter(Boolean).join(' ')}
          style={{
            left: `${selectedObjectRegion.x * 100}%`,
            top: `${selectedObjectRegion.y * 100}%`,
            width: `${selectedObjectRegion.width * 100}%`,
            height: `${selectedObjectRegion.height * 100}%`,
          }}
        />
      )}
      {interactionFeedback.kind !== 'none' && interactionFeedback.message && (
        <div className={`camera-feedback camera-feedback--${interactionFeedback.kind}`}>
          {interactionFeedback.message}
        </div>
      )}
      {mediaStatus === 'initializing' && (
        <div className="preview-empty preview-empty--initializing">{text.mediaInitializing}</div>
      )}
      {mediaStatus !== 'initializing' && cameraStatus !== 'ready' && (
        <div className="preview-empty">{text.cameraUnavailable}</div>
      )}
    </div>
  )
}
