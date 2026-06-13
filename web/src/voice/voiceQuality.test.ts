import { describe, expect, it } from 'vitest'
import {
  evaluateAsrWordAccuracy,
  evaluateTtsNaturalness,
  quietEnvironmentAsrFixture,
} from './voiceQuality'

describe('voiceQuality', () => {
  it('passes the quiet-environment ASR fixture above 95 percent word accuracy', () => {
    const result = evaluateAsrWordAccuracy(quietEnvironmentAsrFixture)

    expect(result.wordAccuracy).toBe(1)
    expect(result.passed).toBe(true)
  })

  it('fails ASR quality when word accuracy is at or below 95 percent', () => {
    const result = evaluateAsrWordAccuracy([
      { expected: 'hello world', actual: 'hello word' },
      { expected: 'switch to english', actual: 'switch to english' },
    ])

    expect(result.wordAccuracy).toBeLessThanOrEqual(0.95)
    expect(result.passed).toBe(false)
  })

  it('accepts TTS naturalness only above MOS 4.0', () => {
    expect(evaluateTtsNaturalness('web-speech', 4.1).passed).toBe(true)
    expect(evaluateTtsNaturalness('web-speech', 4.0).passed).toBe(false)
  })
})
