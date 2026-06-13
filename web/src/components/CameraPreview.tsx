import { useCallback, useEffect, useRef, useState } from 'react'
import { eventBus } from '../core/event-bus'
import { appCore } from '../core/bootstrap'
import { MEDIA_EVENTS, type StreamState } from '../core/media/types'
import {
  CUSTOM_OBJECT_EVENTS,
  type CustomObjectRegionSelectedPayload,
  type VisionRegion,
} from '../core/vision/types'

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamState, setStreamState] = useState<StreamState>(
    appCore.mediaStreamManager.getState(),
  )
  const [selectedRegion, setSelectedRegion] = useState<VisionRegion | null>(null)

  useEffect(() => {
    return eventBus.on<StreamState>(MEDIA_EVENTS.STREAM_STATE, setStreamState)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (streamState.status === 'active' && streamState.stream) {
      video.srcObject = streamState.stream
      void video.play()
    } else {
      video.pause()
      video.srcObject = null
    }
  }, [streamState])

  const handleRetry = useCallback(() => {
    void appCore.mediaStreamManager.start().catch(() => {})
  }, [])

  const selectCenterRegion = useCallback(() => {
    const region: VisionRegion = {
      x: 0.3,
      y: 0.25,
      width: 0.4,
      height: 0.5,
      label: 'selected object',
    }
    setSelectedRegion(region)
    const payload: CustomObjectRegionSelectedPayload = {
      region,
      timestamp: Date.now(),
    }
    eventBus.emit(CUSTOM_OBJECT_EVENTS.REGION_SELECTED, payload)
  }, [])

  if (streamState.status === 'inactive') {
    return null
  }

  if (streamState.status === 'starting') {
    return (
      <div className="camera-preview camera-preview--loading">
        <p>正在打开摄像头…</p>
      </div>
    )
  }

  if (streamState.status === 'error' && streamState.error) {
    return (
      <div className="camera-preview camera-preview--error">
        <p>{streamState.error.message}</p>
        <button type="button" onClick={handleRetry}>
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="camera-preview">
      <video
        ref={videoRef}
        className="camera-preview__video"
        autoPlay
        playsInline
        muted
      />
      {selectedRegion && (
        <div
          className="camera-preview__selection"
          style={{
            left: `${selectedRegion.x * 100}%`,
            top: `${selectedRegion.y * 100}%`,
            width: `${selectedRegion.width * 100}%`,
            height: `${selectedRegion.height * 100}%`,
          }}
        />
      )}
      <button
        type="button"
        className="camera-preview__select"
        onClick={selectCenterRegion}
      >
        框选中间物体
      </button>
    </div>
  )
}
