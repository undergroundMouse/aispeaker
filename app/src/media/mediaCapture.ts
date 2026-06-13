import type { DeviceStatus, MediaCaptureState, MediaStatus, MediaPrivacyConsent } from '../types'
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

const virtualMicrophoneLabelPatterns = [
  /iriun/i,
  /todesk/i,
  /virtual/i,
  /虚拟/u,
  /webcam/i,
]

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

export interface RequestMediaCaptureOptions {
  onMicrophoneReady?: (
    partial: Pick<MediaCaptureState, 'microphoneStatus' | 'microphoneStream'>,
  ) => void
}

export async function requestMediaCapture(
  mediaDevices = navigator.mediaDevices,
  consent?: MediaPrivacyConsent,
  options?: RequestMediaCaptureOptions,
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

  const cameraPromise: Promise<PromiseSettledResult<MediaStream>> = !consent || isCameraCaptureAuthorized(consent)
    ? mediaDevices
        .getUserMedia(cameraConstraints)
        .then((value) => ({ status: 'fulfilled' as const, value }))
        .catch((reason) => ({ status: 'rejected' as const, reason }))
    : Promise.resolve({
        status: 'rejected' as const,
        reason: new DOMException('Camera capture not authorized.', 'NotAllowedError'),
      })

  const microphonePromise: Promise<PromiseSettledResult<MediaStream>> =
    !consent || isMicrophoneCaptureAuthorized(consent)
      ? requestMicrophoneStream(mediaDevices)
      : Promise.resolve({
          status: 'rejected' as const,
          reason: new DOMException('Microphone capture not authorized.', 'NotAllowedError'),
        })

  const microphoneResult = await microphonePromise
  const earlyMicrophoneStream = getFulfilledStream(microphoneResult)
  const earlyMicrophoneStatus = getResultStatus(microphoneResult, 'audio')
  if (earlyMicrophoneStream && earlyMicrophoneStatus === 'ready') {
    options?.onMicrophoneReady?.({
      microphoneStatus: earlyMicrophoneStatus,
      microphoneStream: earlyMicrophoneStream,
    })
  }

  const cameraResult = await cameraPromise

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

async function requestMicrophoneStream(mediaDevices: MediaDevices): Promise<PromiseSettledResult<MediaStream>> {
  const preferredConstraints = await getPreferredMicrophoneConstraints(mediaDevices)
  const preferredResult = await getSettledUserMedia(mediaDevices, preferredConstraints)
  if (preferredResult.status === 'fulfilled' || preferredConstraints === microphoneConstraints) {
    return preferredResult
  }

  return getSettledUserMedia(mediaDevices, microphoneConstraints)
}

async function getPreferredMicrophoneConstraints(mediaDevices: MediaDevices): Promise<MediaStreamConstraints> {
  if (typeof mediaDevices.enumerateDevices !== 'function') {
    return microphoneConstraints
  }

  try {
    const preferredDevice = (await mediaDevices.enumerateDevices())
      .filter((device) => device.kind === 'audioinput' && device.deviceId)
      .sort((left, right) => getMicrophoneDeviceScore(right) - getMicrophoneDeviceScore(left))[0]

    if (!preferredDevice || getMicrophoneDeviceScore(preferredDevice) <= 0) {
      return microphoneConstraints
    }

    return {
      audio: {
        ...(microphoneConstraints.audio as MediaTrackConstraints),
        deviceId: { exact: preferredDevice.deviceId },
      },
    }
  } catch {
    return microphoneConstraints
  }
}

function getMicrophoneDeviceScore(device: MediaDeviceInfo): number {
  const label = device.label.trim()
  if (!label) {
    return 0
  }

  const lowerLabel = label.toLocaleLowerCase()
  let score = 1
  if (lowerLabel.includes('microphone') || label.includes('麦克风')) {
    score += 3
  }
  if (lowerLabel.includes('default') || lowerLabel.includes('communications')) {
    score -= 1
  }
  if (virtualMicrophoneLabelPatterns.some((pattern) => pattern.test(label))) {
    score -= 5
  }

  return score
}

function getSettledUserMedia(
  mediaDevices: MediaDevices,
  constraints: MediaStreamConstraints,
): Promise<PromiseSettledResult<MediaStream>> {
  return mediaDevices
    .getUserMedia(constraints)
    .then((value) => ({ status: 'fulfilled' as const, value }))
    .catch((reason) => ({ status: 'rejected' as const, reason }))
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

  if (microphoneStatus === 'ready' || cameraStatus === 'ready') {
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
