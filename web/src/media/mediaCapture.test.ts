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
): MediaDevices {
  return { getUserMedia } as unknown as MediaDevices
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

  it('keeps video available when microphone capture fails', async () => {
    const getUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.resolve(new MockMediaStream([createTrack('video')]) as unknown as MediaStream)
      }

      return Promise.reject(new Error('No microphone'))
    })

    const state = await requestMediaCapture(createMediaDevices(getUserMedia))

    expect(state.status).toBe('device-error')
    expect(state.cameraStatus).toBe('ready')
    expect(state.microphoneStatus).toBe('device-error')
    expect(state.cameraStream).not.toBeNull()
    expect(state.errorMessage).toBe('Video preview is available, but voice input is unavailable.')
  })

  it('returns permission-denied when both requests are denied', async () => {
    const error = new DOMException('Denied', 'NotAllowedError')
    const state = await requestMediaCapture(createMediaDevices(() => Promise.reject(error)))

    expect(state.status).toBe('permission-denied')
    expect(state.cameraStatus).toBe('permission-denied')
    expect(state.microphoneStatus).toBe('permission-denied')
  })

  it('returns unsupported when getUserMedia is unavailable', async () => {
    const state = await requestMediaCapture({} as MediaDevices)

    expect(state.status).toBe('unsupported')
    expect(state.errorMessage).toContain('WebRTC')
  })
})
