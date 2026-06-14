// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { downsampleToPcm16, floatTo16BitPcm } from './pcmAudioCapture'

describe('pcmAudioCapture', () => {
  it('converts float samples to 16-bit PCM', () => {
    const pcm = floatTo16BitPcm(new Float32Array([0, 1, -1]))
    expect(pcm[0]).toBe(0)
    expect(pcm[1]).toBe(0x7fff)
    expect(pcm[2]).toBe(-0x8000)
  })

  it('downsamples audio to 16kHz', () => {
    const input = new Float32Array([0, 1, 0, -1, 0, 1])
    const pcm = downsampleToPcm16(input, 48_000)
    expect(pcm.length).toBe(2)
  })
})
