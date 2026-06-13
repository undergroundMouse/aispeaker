export const IMAGE_TOKENS_PER_1024PX_EDGE = 85

export function estimateTextTokens(text: string): number {
  const normalized = text.trim()
  if (!normalized) {
    return 0
  }

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

export function estimateRequestTokens(input: { text: string; frameWidth?: number; frameHeight?: number }): number {
  return (
    estimateTextTokens(input.text) +
    estimateImageTokens(input.frameWidth ?? 0, input.frameHeight ?? 0)
  )
}
