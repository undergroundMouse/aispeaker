import type { DeviceStatus, MediaCaptureState, MediaPrivacyConsent, MediaStatus } from '../types'
import { canStartMediaCapture, isCameraCaptureAuthorized, isMicrophoneCaptureAuthorized } from './mediaPrivacy'

const cameraConstraints: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

const microphoneConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
}

export const emptyMediaCaptureState = (): MediaCaptureState => ({
  status: 'idle',
  cameraStatus: 'idle',
  microphoneStatus: 'idle',
  stream: null,
  cameraStream: null,
  microphoneStream: null,
  errorMessage: null,
})

export function isMediaCaptureSupported(mediaDevices = navigator.mediaDevices): boolean {
  return typeof mediaDevices?.getUserMedia === 'function'
}

export async function requestMediaCapture(
  mediaDevices = navigator.mediaDevices,
  consent?: MediaPrivacyConsent,
): Promise<MediaCaptureState> {
  if (consent && !canStartMediaCapture(consent)) {
    return {
      ...emptyMediaCaptureState(),
      status: 'permission-denied',
      cameraStatus: 'permission-denied',
      microphoneStatus: 'permission-denied',
      errorMessage: 'Media capture requires explicit user authorization.',
    }
  }

  if (!isMediaCaptureSupported(mediaDevices)) {
    return {
      ...emptyMediaCaptureState(),
      status: 'unsupported',
      cameraStatus: 'unsupported',
      microphoneStatus: 'unsupported',
      errorMessage: 'This runtime does not support WebRTC media capture.',
    }
  }

  const requests: Array<Promise<MediaStream>> = []

  if (!consent || isCameraCaptureAuthorized(consent)) {
    requests.push(mediaDevices.getUserMedia(cameraConstraints))
  } else {
    requests.push(Promise.reject(new DOMException('Camera capture not authorized.', 'NotAllowedError')))
  }

  if (!consent || isMicrophoneCaptureAuthorized(consent)) {
    requests.push(mediaDevices.getUserMedia(microphoneConstraints))
  } else {
    requests.push(Promise.reject(new DOMException('Microphone capture not authorized.', 'NotAllowedError')))
  }

  const [cameraResult, microphoneResult] = await Promise.allSettled(requests)

  const cameraStream = getFulfilledStream(cameraResult)
  const microphoneStream = getFulfilledStream(microphoneResult)
  const cameraStatus = getResultStatus(cameraResult, 'video')
  const microphoneStatus = getResultStatus(microphoneResult, 'audio')

  if (!cameraStream && !microphoneStream) {
    const firstError = getRejectedReason(cameraResult) ?? getRejectedReason(microphoneResult)
    const denied = isPermissionDenied(firstError)

    return {
      ...emptyMediaCaptureState(),
      status: denied ? 'permission-denied' : 'device-error',
      cameraStatus: denied ? 'permission-denied' : 'device-error',
      microphoneStatus: denied ? 'permission-denied' : 'device-error',
      errorMessage: denied
        ? 'Camera or microphone permission was denied.'
        : getErrorMessage(firstError),
    }
  }

  const stream = new MediaStream([
    ...(cameraStream?.getVideoTracks() ?? []),
    ...(microphoneStream?.getAudioTracks() ?? []),
  ])

  return {
    status: getOverallStatus(cameraStatus, microphoneStatus),
    cameraStatus,
    microphoneStatus,
    stream,
    cameraStream,
    microphoneStream,
    errorMessage: getPartialFailureMessage(cameraStatus, microphoneStatus),
  }
}

export function stopMediaCapture(state: MediaCaptureState): void {
  state.stream?.getTracks().forEach((track) => track.stop())
}

function getTrackStatus(tracks: MediaStreamTrack[]): DeviceStatus {
  if (tracks.length === 0) {
    return 'device-error'
  }

  return tracks.some((track) => track.readyState === 'live') ? 'ready' : 'device-error'
}

function getResultStatus(
  result: PromiseSettledResult<MediaStream>,
  trackType: 'audio' | 'video',
): DeviceStatus {
  if (result.status === 'rejected') {
    return isPermissionDenied(result.reason) ? 'permission-denied' : 'device-error'
  }

  return getTrackStatus(
    trackType === 'video' ? result.value.getVideoTracks() : result.value.getAudioTracks(),
  )
}

function getFulfilledStream(result: PromiseSettledResult<MediaStream>): MediaStream | null {
  return result.status === 'fulfilled' ? result.value : null
}

function getRejectedReason(result: PromiseSettledResult<MediaStream>): unknown {
  return result.status === 'rejected' ? result.reason : null
}

function getOverallStatus(cameraStatus: DeviceStatus, microphoneStatus: DeviceStatus): MediaStatus {
  if (cameraStatus === 'ready' && microphoneStatus === 'ready') {
    return 'ready'
  }

  if (cameraStatus === 'unsupported' || microphoneStatus === 'unsupported') {
    return 'unsupported'
  }

  if (cameraStatus === 'permission-denied' && microphoneStatus === 'permission-denied') {
    return 'permission-denied'
  }

  return 'device-error'
}

function getPartialFailureMessage(
  cameraStatus: DeviceStatus,
  microphoneStatus: DeviceStatus,
): string | null {
  if (cameraStatus === 'ready' && microphoneStatus !== 'ready') {
    return 'Video preview is available, but voice input is unavailable.'
  }

  if (cameraStatus !== 'ready' && microphoneStatus === 'ready') {
    return 'Voice input is available, but camera preview is unavailable.'
  }

  return null
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to initialize camera or microphone.'
}
