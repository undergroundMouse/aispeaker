import type { VisionRegion } from '../types'

export interface TrackState {
  trackId: string
  label: string
  confidence: number
  region: VisionRegion
  lastSeenAt: number
  missedFrames: number
}

const IOU_THRESHOLD = 0.3
const MAX_MISSED_FRAMES = 5

export function computeIoU(a: VisionRegion, b: VisionRegion): number {
  const ax2 = a.x + a.width
  const ay2 = a.y + a.height
  const bx2 = b.x + b.width
  const by2 = b.y + b.height
  const ix1 = Math.max(a.x, b.x)
  const iy1 = Math.max(a.y, b.y)
  const ix2 = Math.min(ax2, bx2)
  const iy2 = Math.min(ay2, by2)
  const iw = Math.max(0, ix2 - ix1)
  const ih = Math.max(0, iy2 - iy1)
  const intersection = iw * ih
  const union = a.width * a.height + b.width * b.height - intersection
  return union > 0 ? intersection / union : 0
}

export class ObjectTracker {
  private tracks: TrackState[] = []
  private nextId = 1

  update(
    detections: Array<{ label: string; confidence: number; region: VisionRegion }>,
    at: number,
  ): TrackState[] {
    const matched = new Set<number>()

    for (const detection of detections) {
      let bestTrack: TrackState | null = null
      let bestIoU = 0

      for (const track of this.tracks) {
        const iou = computeIoU(track.region, detection.region)
        if (iou > bestIoU && iou >= IOU_THRESHOLD) {
          bestIoU = iou
          bestTrack = track
        }
      }

      if (bestTrack) {
        bestTrack.region = detection.region
        bestTrack.confidence = detection.confidence
        bestTrack.label = detection.label
        bestTrack.lastSeenAt = at
        bestTrack.missedFrames = 0
        matched.add(this.tracks.indexOf(bestTrack))
      } else {
        this.tracks.push({
          trackId: `track-${this.nextId++}`,
          label: detection.label,
          confidence: detection.confidence,
          region: detection.region,
          lastSeenAt: at,
          missedFrames: 0,
        })
      }
    }

    for (let i = 0; i < this.tracks.length; i += 1) {
      if (!matched.has(i)) {
        this.tracks[i]!.missedFrames += 1
      }
    }

    this.tracks = this.tracks.filter((t) => t.missedFrames <= MAX_MISSED_FRAMES)
    return [...this.tracks]
  }

  getTracks(): TrackState[] {
    return [...this.tracks]
  }

  findTrack(trackId: string): TrackState | null {
    return this.tracks.find((t) => t.trackId === trackId) ?? null
  }
}
