import type { SampledVideoFrame, SamplingMode } from '../types'

export interface VideoFrameSamplerOptions {
  video: HTMLVideoElement
  onFrame: (frame: SampledVideoFrame) => void
  normalIntervalMs?: number
  reducedIntervalMs?: number
}

export class VideoFrameSampler {
  private readonly video: HTMLVideoElement
  private readonly onFrame: (frame: SampledVideoFrame) => void
  private normalIntervalMs: number
  private reducedIntervalMs: number
  private readonly canvas = document.createElement('canvas')
  private timerId: number | null = null
  private mode: SamplingMode = 'paused'

  constructor({
    video,
    onFrame,
    normalIntervalMs = 1000,
    reducedIntervalMs = 5000,
  }: VideoFrameSamplerOptions) {
    this.video = video
    this.onFrame = onFrame
    this.normalIntervalMs = normalIntervalMs
    this.reducedIntervalMs = reducedIntervalMs
  }

  start(mode: Exclude<SamplingMode, 'paused'> = 'normal'): void {
    this.setMode(mode)
  }

  setMode(mode: SamplingMode): void {
    this.mode = mode
    this.clearTimer()

    if (mode === 'paused') {
      return
    }

    this.captureFrame()
    this.timerId = window.setInterval(
      () => this.captureFrame(),
      mode === 'normal' ? this.normalIntervalMs : this.reducedIntervalMs,
    )
  }

  stop(): void {
    this.setMode('paused')
  }

  getMode(): SamplingMode {
    return this.mode
  }

  setIntervals(normalIntervalMs: number, reducedIntervalMs: number): void {
    this.normalIntervalMs = normalIntervalMs
    this.reducedIntervalMs = reducedIntervalMs
    if (this.mode !== 'paused') {
      this.setMode(this.mode)
    }
  }

  private captureFrame(): void {
    if (!this.canCapture()) {
      return
    }

    this.canvas.width = this.video.videoWidth
    this.canvas.height = this.video.videoHeight
    const context = this.canvas.getContext('2d')

    if (!context) {
      return
    }

    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
    this.canvas.toBlob((blob) => {
      if (!blob || this.mode === 'paused') {
        return
      }

      this.onFrame({
        blob,
        capturedAt: Date.now(),
        width: this.canvas.width,
        height: this.canvas.height,
        mode: this.mode,
      })
    }, 'image/jpeg')
  }

  private canCapture(): boolean {
    return this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && this.video.videoWidth > 0
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId)
      this.timerId = null
    }
  }
}
