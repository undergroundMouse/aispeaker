import { eventBus } from '../event-bus'
import {
  CAMERA_ERROR_MESSAGES,
  mapMediaError,
} from './cameraErrors'
import {
  MEDIA_EVENTS,
  type StreamState,
} from './types'

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
}

export class MediaStreamManager {
  private stream: MediaStream | null = null
  private state: StreamState = { status: 'inactive', stream: null }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.stop())
    }
  }

  getState(): StreamState {
    return this.state
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  async start(): Promise<void> {
    if (this.state.status === 'starting' || this.state.status === 'active') {
      return
    }

    this.setState({ status: 'starting', stream: null })

    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS)
      this.stream = stream
      this.setState({ status: 'active', stream })
    } catch (err) {
      const mapped = mapMediaError(err)
      this.stream = null
      this.setState({
        status: 'error',
        stream: null,
        error: {
          code: mapped.code,
          message: CAMERA_ERROR_MESSAGES[mapped.code],
        },
      })
      throw err
    }
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
    this.setState({ status: 'inactive', stream: null })
  }

  private setState(next: StreamState): void {
    this.state = next
    eventBus.emit(MEDIA_EVENTS.STREAM_STATE, { ...next })
  }
}

export const mediaStreamManager = new MediaStreamManager()
