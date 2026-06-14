import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isMediaCaptureSupported, requestMediaCapture } from './mediaCapture'

class MockMediaStream {
  private readonly videoTracks: MediaStreamTrack[]
  private readonly audioTracks: MediaStreamTrack[]

  constructor(tracks: MediaStreamTrack[] = []) {
    this.videoTracks = tracks.filter((track) => track.kind === 'video')
    this.audioTracks = tracks.filter((track) => track.kind === 'audio')
  }

  getVideoTracks() {
    return this.videoTracks
  }

  getAudioTracks() {
    return this.audioTracks
  }

  getTracks() {
    return [...this.videoTracks, ...this.audioTracks]
  }
}

function createTrack(kind: 'audio' | 'video'): MediaStreamTrack {
  return {
    kind,
    readyState: 'live',
    stop: vi.fn(),
  } as unknown as MediaStreamTrack
}

function createMediaDevices(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  devices: MediaDeviceInfo[] = [],
): MediaDevices {
  return {
    getUserMedia,
    enumerateDevices: () => Promise.resolve(devices),
  } as unknown as MediaDevices
}

describe('mediaCapture', () => {
  beforeEach(() => {
    vi.stubGlobal('MediaStream', MockMediaStream)
  })

  it('detects unsupported WebRTC media capture runtimes', () => {
    expect(isMediaCaptureSupported({} as MediaDevices)).toBe(false)
  })

  it('requests camera and microphone streams and combines tracks', async () => {
    const getUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.resolve(new MockMediaStream([createTrack('video')]) as unknown as MediaStream)
      }

      return Promise.resolve(new MockMediaStream([createTrack('audio')]) as unknown as MediaStream)
    })

    const state = await requestMediaCapture(createMediaDevices(getUserMedia))

    expect(state.status).toBe('ready')
    expect(state.cameraStatus).toBe('ready')
    expect(state.microphoneStatus).toBe('ready')
    expect(state.stream?.getTracks()).toHaveLength(2)
  })

  it('prefers a physical microphone over virtual camera audio inputs', async () => {
    const getUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.resolve(new MockMediaStream([createTrack('video')]) as unknown as MediaStream)
      }

      return Promise.resolve(new MockMediaStream([createTrack('audio')]) as unknown as MediaStream)
    })
    const devices = [
      { kind: 'audioinput', label: '麦克风 (Iriun Webcam)', deviceId: 'iriun' },
      { kind: 'audioinput', label: 'Microphone (K02BS)', deviceId: 'physical' },
    ] as MediaDeviceInfo[]

    const state = await requestMediaCapture(createMediaDevices(getUserMedia, devices))

    expect(state.microphoneStatus).toBe('ready')
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.objectContaining({
          deviceId: { exact: 'physical' },
        }),
      }),
    )
  })

  it('keeps video available when microphone capture fails', async () => {
    const getUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.resolve(new MockMediaStream([createTrack('video')]) as unknown as MediaStream)
      }

      return Promise.reject(new Error('No microphone'))
    })

    const state = await requestMediaCapture(createMediaDevices(getUserMedia))

    expect(state.status).toBe('ready')
    expect(state.cameraStatus).toBe('ready')
    expect(state.microphoneStatus).toBe('device-error')
    expect(state.cameraStream).not.toBeNull()
    expect(state.errorMessage).toBe('Video preview is available, but voice input is unavailable.')
  })

  it('keeps voice available when camera capture fails', async () => {
    const getUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.reject(new Error('No camera'))
      }

      return Promise.resolve(new MockMediaStream([createTrack('audio')]) as unknown as MediaStream)
    })

    const state = await requestMediaCapture(createMediaDevices(getUserMedia))

    expect(state.status).toBe('ready')
    expect(state.cameraStatus).toBe('device-error')
    expect(state.microphoneStatus).toBe('ready')
    expect(state.microphoneStream).not.toBeNull()
    expect(state.errorMessage).toBe('Voice input is available, but camera preview is unavailable.')
  })

  it('returns permission-denied when both requests are denied', async () => {
    const error = new DOMException('Denied', 'NotAllowedError')
    const state = await requestMediaCapture(createMediaDevices(() => Promise.reject(error)))

    expect(state.status).toBe('permission-denied')
    expect(state.cameraStatus).toBe('permission-denied')
    expect(state.microphoneStatus).toBe('permission-denied')
  })

  it('blocks capture when explicit consent is revoked', async () => {
    const state = await requestMediaCapture(createMediaDevices(() => Promise.resolve(new MockMediaStream([]) as unknown as MediaStream)), {
      cameraCapture: false,
      microphoneCapture: false,
      cloudMediaTransmission: false,
    })

    expect(state.status).toBe('permission-denied')
    expect(state.errorMessage).toContain('authorization')
  })

  it('returns unsupported when getUserMedia is unavailable', async () => {
    const state = await requestMediaCapture({} as MediaDevices)

    expect(state.status).toBe('unsupported')
    expect(state.errorMessage).toContain('WebRTC')
  })
})
