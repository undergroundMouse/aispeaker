import { useCallback, useEffect, useRef, useState } from 'react'
import { eventBus } from '../core/event-bus'
import { appCore } from '../core/bootstrap'
import { MEDIA_EVENTS, type StreamState } from '../core/media/types'

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamState, setStreamState] = useState<StreamState>(
    appCore.mediaStreamManager.getState(),
  )

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
    </div>
  )
}
