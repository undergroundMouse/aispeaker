import { describe, expect, it } from 'vitest'
import { ObjectTracker, computeIoU } from './objectTracker'

describe('ObjectTracker', () => {
  it('maintains track across similar regions', () => {
    const tracker = new ObjectTracker()
    const first = tracker.update(
      [{ label: 'cup', confidence: 0.9, region: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 } }],
      1000,
    )
    const second = tracker.update(
      [{ label: 'cup', confidence: 0.88, region: { x: 0.21, y: 0.21, width: 0.2, height: 0.2 } }],
      1100,
    )

    expect(first[0]?.trackId).toBe(second[0]?.trackId)
  })

  it('computes IoU above threshold for overlapping boxes', () => {
    const iou = computeIoU(
      { x: 0.2, y: 0.2, width: 0.2, height: 0.2 },
      { x: 0.21, y: 0.21, width: 0.2, height: 0.2 },
    )
    expect(iou).toBeGreaterThan(0.7)
  })
})
