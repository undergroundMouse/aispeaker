import type { SampledVideoFrame } from '../types'

export const IMAGE_TOKENS_PER_1024PX_EDGE = 85

export function estimateTextTokens(text: string): number {
  const normalized = text.trim()
  if (!normalized) {
    return 0
  }

  // Heuristic: ~4 characters per token for mixed CJK/Latin prompts.
  return Math.max(1, Math.ceil(normalized.length / 4))
}

export function estimateImageTokens(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 0
  }

  const edge = Math.max(width, height)
  const blocks = Math.ceil(edge / 1024)
  return blocks * IMAGE_TOKENS_PER_1024PX_EDGE
}

export function estimateFrameTokens(frame: SampledVideoFrame | null): number {
  if (!frame) {
    return 0
  }

  return estimateImageTokens(frame.width, frame.height)
}

export interface TokenEstimateInput {
  text: string
  frame?: SampledVideoFrame | null
}

export function estimateRequestTokens(input: TokenEstimateInput): number {
  return estimateTextTokens(input.text) + estimateFrameTokens(input.frame ?? null)
}
