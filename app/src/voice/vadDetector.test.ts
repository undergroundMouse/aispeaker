import { describe, expect, it } from 'vitest'
import { VadDetector, computeRms } from './vadDetector'

describe('VadDetector', () => {
  it('detects speech start and end', () => {
    const events: string[] = []
    const vad = new VadDetector({
      speechThreshold: 0.03,
      silenceEndpointMs: 0,
      onSpeechStart: () => events.push('start'),
      onSpeechEnd: () => events.push('end'),
    })

    vad.processRms(0.1)
    vad.processRms(0.001)
    vad.processRms(0.001)

    expect(events).toContain('start')
    expect(events).toContain('end')
  })

  it('computes RMS from samples', () => {
    const rms = computeRms(new Float32Array([0.5, 0.5, 0.5, 0.5]))
    expect(rms).toBeCloseTo(0.5, 1)
  })
})
