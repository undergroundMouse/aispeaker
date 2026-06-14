import type { VisionDelta } from '@ai/shared'
import type { SampledVideoFrame, VisionRegion } from '../types'
import { ObjectTracker } from './objectTracker'
import { OcrProvider } from './ocrProvider'
import { GestureActionProvider } from './gestureActionProvider'

const DEFAULT_BUFFER_SIZE = 45

export interface VisionWorldModelOptions {
  bufferSize?: number
}

export class VisionWorldModel {
  private readonly buffer: SampledVideoFrame[] = []
  private readonly bufferSize: number
  private readonly tracker = new ObjectTracker()
  private readonly ocr = new OcrProvider()
  private readonly gestures = new GestureActionProvider()
  private lastSceneHash = ''
  private frameSeq = 0

  constructor(options: VisionWorldModelOptions = {}) {
    this.bufferSize = options.bufferSize ?? DEFAULT_BUFFER_SIZE
  }

  ingestFrame(frame: SampledVideoFrame, transcript = ''): VisionDelta {
    this.buffer.push(frame)
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift()
    }

    this.frameSeq += 1
    const at = frame.capturedAt
    const detections = this.inferDetections(frame)
    const trackedObjects = this.tracker.update(detections, at).map((t) => ({
      trackId: t.trackId,
      label: t.label,
      confidence: t.confidence,
      region: t.region,
      lastSeenAt: t.lastSeenAt,
    }))

    const sceneHash = `${frame.width}x${frame.height}-${frame.mode}`
    const sceneChange = this.lastSceneHash !== '' && this.lastSceneHash !== sceneHash
    this.lastSceneHash = sceneHash

    const normalized = transcript.trim().toLocaleLowerCase()
    const gestureList = this.gestures.detect(normalized).map((g) => ({
      type: g.type,
      label: g.label,
      confidence: g.confidence,
    }))

    return {
      trackedObjects,
      sceneChange,
      gestures: gestureList,
      ocrRegions: this.ocr.detect(`frame-${this.frameSeq}`),
      frameSeq: this.frameSeq,
      capturedAt: at,
    }
  }

  getRecentFrames(): SampledVideoFrame[] {
    return [...this.buffer]
  }

  getTrackHistory(trackId: string): VisionRegion[] {
    const track = this.tracker.findTrack(trackId)
    return track ? [track.region] : []
  }

  private inferDetections(
    _frame: SampledVideoFrame,
  ): Array<{ label: string; confidence: number; region: VisionRegion }> {
    // Real object detection is not wired here yet; avoid placeholder labels that block cloud/Omni vision.
    return []
  }
}
