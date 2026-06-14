import { describe, expect, it } from 'vitest'
import type { SampledVideoFrame } from '../types'
import { MockLocalVisionAnalyzer } from './localVision'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

describe('MockLocalVisionAnalyzer', () => {
  it('answers scene requests locally when confidence is high enough', async () => {
    const analyzer = new MockLocalVisionAnalyzer({
      sceneCandidates: [{ label: 'office', confidence: 0.91 }],
    })

    const signals = await analyzer.analyze({
      frame,
      transcript: '我现在在哪类场景',
      language: 'zh',
    })

    expect(signals.sceneCandidates[0]?.label).toBe('office')
    expect(signals.shouldUseCloud).toBe(false)
  })

  it('escalates low-confidence visual requests to cloud processing', async () => {
    const analyzer = new MockLocalVisionAnalyzer({
      sceneCandidates: [{ label: 'office', confidence: 0.4 }],
    })

    const signals = await analyzer.analyze({
      frame,
      transcript: 'what kind of place am I in',
      language: 'en',
    })

    expect(signals.shouldUseCloud).toBe(true)
  })

  it('maps configured gestures to language-aware spoken responses', async () => {
    const analyzer = new MockLocalVisionAnalyzer()

    const signals = await analyzer.analyze({
      frame,
      transcript: 'raise hand',
      language: 'en',
    })

    expect(signals.gestures[0]?.type).toBe('raised-hand')
    expect(signals.gestures[0]?.spokenResponse).toBe('You raised your hand.')
  })
})
