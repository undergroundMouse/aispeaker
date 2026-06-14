import { describe, expect, it } from 'vitest'
import {
  cloneSampledVideoFrame,
  releaseSampledVideoFrame,
  stripMediaForCloud,
  withEphemeralFrame,
  withEphemeralFrameAsync,
} from './ephemeralMedia'
import type { SampledVideoFrame } from '../types'

function createFrame(): SampledVideoFrame {
  return {
    blob: new Blob(['frame']),
    capturedAt: 1,
    width: 640,
    height: 480,
    mode: 'normal',
  }
}

describe('ephemeralMedia', () => {
  it('releases sampled frame blob references after processing', () => {
    const frame = createFrame()
    releaseSampledVideoFrame(frame)
    expect(frame.blob).toBeNull()
  })

  it('releases cloned frame after synchronous processing without mutating source frame', () => {
    const frame = createFrame()
    withEphemeralFrame(frame, (current) => current?.width ?? 0)
    expect(frame.blob).not.toBeNull()
  })

  it('releases cloned frame after async processing without mutating source frame', async () => {
    const frame = createFrame()
    await withEphemeralFrameAsync(frame, async (current) => current?.width ?? 0)
    expect(frame.blob).not.toBeNull()
  })

  it('clones sampled frames before ephemeral release', () => {
    const frame = createFrame()
    const clone = cloneSampledVideoFrame(frame)
    expect(clone).not.toBe(frame)
    expect(clone.blob).not.toBe(frame.blob)
    expect(clone.width).toBe(frame.width)
  })

  it('strips media from cloud payloads when unauthorized', () => {
    const frame = createFrame()
    const payload = stripMediaForCloud({ frame, transcript: 'test' }, false)
    expect(payload.frame).toBeNull()
    expect(payload.transcript).toBe('test')
  })
})
