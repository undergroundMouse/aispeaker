import { describe, expect, it } from 'vitest'
import { releaseSampledVideoFrame, stripMediaForCloud, withEphemeralFrame } from './ephemeralMedia'
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

  it('releases frame after synchronous processing', () => {
    const frame = createFrame()
    withEphemeralFrame(frame, (current) => current?.width ?? 0)
    expect(frame.blob).toBeNull()
  })

  it('strips media from cloud payloads when unauthorized', () => {
    const frame = createFrame()
    const payload = stripMediaForCloud({ frame, transcript: 'test' }, false)
    expect(payload.frame).toBeNull()
    expect(payload.transcript).toBe('test')
  })
})
