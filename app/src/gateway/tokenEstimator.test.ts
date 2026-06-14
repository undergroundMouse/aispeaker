import { describe, expect, it } from 'vitest'
import { estimateImageTokens, estimateRequestTokens, estimateTextTokens, IMAGE_TOKENS_PER_1024PX_EDGE } from './tokenEstimator'

describe('tokenEstimator', () => {
  it('estimates text tokens from prompt length', () => {
    expect(estimateTextTokens('hello world')).toBeGreaterThan(0)
    expect(estimateTextTokens('')).toBe(0)
  })

  it('estimates image tokens using 85 tokens per 1024px edge', () => {
    expect(estimateImageTokens(1024, 768)).toBe(IMAGE_TOKENS_PER_1024PX_EDGE)
    expect(estimateImageTokens(2048, 1024)).toBe(IMAGE_TOKENS_PER_1024PX_EDGE * 2)
  })

  it('accumulates text and image tokens for a request', () => {
    const total = estimateRequestTokens({
      text: 'what is this object',
      frame: {
        blob: new Blob(['frame']),
        capturedAt: 1,
        width: 1024,
        height: 768,
        mode: 'normal',
      },
    })

    expect(total).toBe(estimateTextTokens('what is this object') + IMAGE_TOKENS_PER_1024PX_EDGE)
  })
})
