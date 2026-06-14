import type { VisionRegion } from '../types'

export interface OcrDetection {
  text: string
  region: VisionRegion
  confidence: number
}

const DIGIT_PATTERN = /\d{3,}/

export class OcrProvider {
  detect(frameLabel: string): OcrDetection[] {
    const detections: OcrDetection[] = []
    const matches = frameLabel.match(/[A-Za-z0-9\u4e00-\u9fff]{2,}/g) ?? []
    matches.forEach((text, index) => {
      detections.push({
        text,
        confidence: DIGIT_PATTERN.test(text) ? 0.9 : 0.75,
        region: {
          x: 0.1 + index * 0.1,
          y: 0.1,
          width: 0.2,
          height: 0.08,
          label: 'ocr',
        },
      })
    })
    return detections
  }
}
