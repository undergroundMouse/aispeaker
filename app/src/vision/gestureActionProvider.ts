import type { GestureDetection } from '../types'

export class GestureActionProvider {
  detect(normalizedTranscript: string): GestureDetection[] {
    const gestures: GestureDetection[] = []
    if (normalizedTranscript.includes('nod') || normalizedTranscript.includes('点头')) {
      gestures.push({
        type: 'nod',
        label: 'nod',
        confidence: 0.84,
        spokenResponse: '你点头了',
      })
    }
    if (
      normalizedTranscript.includes('举手') ||
      normalizedTranscript.includes('raise') ||
      normalizedTranscript.includes('hand')
    ) {
      gestures.push({
        type: 'raised-hand',
        label: 'raised hand',
        confidence: 0.86,
        spokenResponse: '你举手了',
      })
    }
    return gestures
  }
}
