import type { DeviceStatus, SampledVideoFrame, SamplingMode } from '../types'

export async function captureVideoFrame(
  video: HTMLVideoElement | null,
  mode: SamplingMode = 'normal',
): Promise<SampledVideoFrame | null> {
  if (!video || !canCaptureFromVideo(video)) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await canvasToJpegBlob(canvas)
  if (!blob) {
    return null
  }

  return {
    blob,
    capturedAt: Date.now(),
    width: canvas.width,
    height: canvas.height,
    mode: mode === 'paused' ? 'normal' : mode,
  }
}

export function createFallbackFrame(
  cameraStatus: DeviceStatus,
  samplingMode: SamplingMode,
  video: HTMLVideoElement | null,
): SampledVideoFrame | null {
  if (cameraStatus !== 'ready') {
    return null
  }

  return {
    blob: new Blob(['local-frame'], { type: 'image/jpeg' }),
    capturedAt: Date.now(),
    width: video?.videoWidth || 640,
    height: video?.videoHeight || 480,
    mode: samplingMode === 'paused' ? 'normal' : samplingMode,
  }
}

export async function resolveTurnFrame(
  video: HTMLVideoElement | null,
  cameraStatus: DeviceStatus,
  samplingMode: SamplingMode,
): Promise<SampledVideoFrame | null> {
  return (await captureVideoFrame(video, samplingMode)) ?? createFallbackFrame(cameraStatus, samplingMode, video)
}

function canCaptureFromVideo(video: HTMLVideoElement): boolean {
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg')
  })
}
