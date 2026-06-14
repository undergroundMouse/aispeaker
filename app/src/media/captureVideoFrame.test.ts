import { describe, expect, it } from 'vitest'
import { captureVideoFrame, createFallbackFrame, resolveTurnFrame } from './captureVideoFrame'

describe('captureVideoFrame', () => {
  it('returns null when video is unavailable', async () => {
    await expect(captureVideoFrame(null)).resolves.toBeNull()
  })

  it('falls back to a placeholder frame when capture is unavailable', async () => {
    const frame = await resolveTurnFrame(null, 'ready', 'normal')
    expect(frame).toMatchObject({
      width: 640,
      height: 480,
      mode: 'normal',
    })
    expect(frame?.blob).not.toBeNull()
  })

  it('returns null fallback frame when camera is not ready', () => {
    expect(createFallbackFrame('idle', 'normal', null)).toBeNull()
  })
})
