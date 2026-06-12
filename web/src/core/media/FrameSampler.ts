import { eventBus } from '../event-bus'
import {
  CONVERSATION_EVENTS,
  MEDIA_EVENTS,
  SAMPLING_INTERVALS,
  type ConversationState,
  type MediaFrame,
  type ThumbnailFrame,
} from './types'

const THUMBNAIL_SIZE = 224
const JPEG_QUALITY = 0.8

export class FrameSampler {
  private videoEl: HTMLVideoElement | null = null
  private rawCanvas: HTMLCanvasElement | null = null
  private thumbCanvas: HTMLCanvasElement | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private frameId = 0
  private conversationState: ConversationState = 'idle'
  private lastActiveAt = Date.now()
  private samplingMs: number = SAMPLING_INTERVALS.ACTIVE_MS
  private running = false

  private latestRaw: MediaFrame | null = null
  private latestThumbnail: ThumbnailFrame | null = null

  private unsubscribeConversation?: () => void

  start(stream: MediaStream): void {
    this.stop()
    this.running = true
    this.frameId = 0
    this.lastActiveAt = Date.now()

    this.videoEl = document.createElement('video')
    this.videoEl.autoplay = true
    this.videoEl.playsInline = true
    this.videoEl.muted = true
    this.videoEl.srcObject = stream

    this.rawCanvas = document.createElement('canvas')
    this.thumbCanvas = document.createElement('canvas')
    this.thumbCanvas.width = THUMBNAIL_SIZE
    this.thumbCanvas.height = THUMBNAIL_SIZE

    this.unsubscribeConversation = eventBus.on<{ state: ConversationState }>(
      CONVERSATION_EVENTS.STATE_CHANGED,
      ({ state }) => this.onConversationStateChanged(state),
    )

    void this.videoEl.play().then(() => this.scheduleSampling())
  }

  stop(): void {
    this.running = false
    this.clearInterval()

    this.unsubscribeConversation?.()
    this.unsubscribeConversation = undefined

    if (this.videoEl) {
      this.videoEl.pause()
      this.videoEl.srcObject = null
      this.videoEl = null
    }

    this.rawCanvas = null
    this.thumbCanvas = null
    this.latestRaw = null
    this.latestThumbnail = null
  }

  getLatestRaw(): MediaFrame | null {
    return this.latestRaw
  }

  getLatestThumbnail(): ThumbnailFrame | null {
    return this.latestThumbnail
  }

  private onConversationStateChanged(state: ConversationState): void {
    this.conversationState = state
    if (state !== 'idle') {
      this.lastActiveAt = Date.now()
    }
    this.updateSamplingRate()
  }

  private updateSamplingRate(): void {
    const idleDuration = Date.now() - this.lastActiveAt
    const isIdle =
      this.conversationState === 'idle' &&
      idleDuration >= SAMPLING_INTERVALS.IDLE_THRESHOLD_MS

    const nextMs = isIdle
      ? SAMPLING_INTERVALS.IDLE_MS
      : SAMPLING_INTERVALS.ACTIVE_MS

    if (nextMs !== this.samplingMs) {
      this.samplingMs = nextMs
      if (this.running) {
        this.scheduleSampling()
      }
    }
  }

  private scheduleSampling(): void {
    this.clearInterval()
    this.updateSamplingRate()
    this.intervalId = setInterval(() => {
      void this.captureFrame()
      this.updateSamplingRate()
    }, this.samplingMs)
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async captureFrame(): Promise<void> {
    if (!this.running || !this.videoEl || !this.rawCanvas || !this.thumbCanvas) {
      return
    }

    const { videoWidth, videoHeight } = this.videoEl
    if (videoWidth === 0 || videoHeight === 0) return

    this.rawCanvas.width = videoWidth
    this.rawCanvas.height = videoHeight

    const rawCtx = this.rawCanvas.getContext('2d')
    const thumbCtx = this.thumbCanvas.getContext('2d')
    if (!rawCtx || !thumbCtx) return

    rawCtx.drawImage(this.videoEl, 0, 0, videoWidth, videoHeight)
    thumbCtx.drawImage(this.videoEl, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)

    const imageData = rawCtx.getImageData(0, 0, videoWidth, videoHeight)
    const blob = await this.canvasToJpeg(this.thumbCanvas)

    const frameId = ++this.frameId
    const timestamp = Date.now()

    const rawFrame: MediaFrame = {
      frameId,
      timestamp,
      imageData,
      width: videoWidth,
      height: videoHeight,
    }

    const thumbFrame: ThumbnailFrame = {
      frameId,
      timestamp,
      blob,
      width: 224,
      height: 224,
    }

    this.latestRaw = rawFrame
    this.latestThumbnail = thumbFrame

    eventBus.emit(MEDIA_EVENTS.FRAME_RAW, rawFrame)
    eventBus.emit(MEDIA_EVENTS.FRAME_THUMBNAIL, thumbFrame)
  }

  private canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to encode JPEG thumbnail'))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    })
  }
}
