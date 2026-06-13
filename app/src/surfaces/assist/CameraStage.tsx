import type { RefObject } from 'react'
import { VisualEvidenceOverlay } from '../../components/VisualEvidenceOverlay'
import type { ActiveVisualEvidence, AppLanguage, VisionRegion } from '../../types'
import { getMessages } from '../../i18n'

export interface CameraStageProps {
  language: AppLanguage
  videoRef: RefObject<HTMLVideoElement | null>
  cameraStatus: string
  activeVisualEvidence: ActiveVisualEvidence | null
  selectedObjectRegion: VisionRegion | null
  onSelectFromPointer: (clientX: number, clientY: number) => void
}

export function CameraStage({
  language,
  videoRef,
  cameraStatus,
  activeVisualEvidence,
  selectedObjectRegion,
  onSelectFromPointer,
}: CameraStageProps) {
  const text = getMessages(language)

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
          className="selection-box"
          style={{
            left: `${selectedObjectRegion.x * 100}%`,
            top: `${selectedObjectRegion.y * 100}%`,
            width: `${selectedObjectRegion.width * 100}%`,
            height: `${selectedObjectRegion.height * 100}%`,
          }}
        />
      )}
      {cameraStatus !== 'ready' && <div className="preview-empty">{text.cameraUnavailable}</div>}
    </div>
  )
}
