import type { LocalVisionAnalysisInput, LocalVisionAnalyzer, LocalVisionSignals } from '../types'
import {
  defaultLocalVisionThresholds,
  getTopCandidate,
  getTopGesture,
  hasConfidentCandidate,
  hasConfidentGesture,
  isObjectQuestion,
  isSceneQuestion,
  isVisualQuestion,
} from '../ai/localVision'
import { normalizePhrase } from '../voice/localCommands'
import { VisionWorldModel } from './visionWorldModel'

export class ContinuousVisionAnalyzer implements LocalVisionAnalyzer {
  private readonly worldModel: VisionWorldModel

  constructor(worldModel = new VisionWorldModel()) {
    this.worldModel = worldModel
  }

  getWorldModel(): VisionWorldModel {
    return this.worldModel
  }

  async analyze({ frame, transcript, language }: LocalVisionAnalysisInput): Promise<LocalVisionSignals> {
    const normalized = normalizePhrase(transcript)
    const hasFrame = Boolean(frame)
    let objectCandidates = hasFrame && isObjectQuestion(normalized) ? [] : []
    let sceneCandidates = hasFrame && isSceneQuestion(normalized) ? [] : []
    let gestures = hasFrame ? [] : []

    if (frame) {
      const delta = this.worldModel.ingestFrame(frame, transcript)
      objectCandidates = delta.trackedObjects.map((t) => ({
        label: t.label,
        confidence: t.confidence,
        region: t.region,
        source: 'local-vision' as const,
      }))
      sceneCandidates = delta.sceneChange
        ? [{ label: 'scene-changed', confidence: 0.9, region: { x: 0, y: 0, width: 1, height: 1 } }]
        : []
      gestures = delta.gestures.map((g) => ({
        type: g.type as 'raised-hand' | 'nod',
        label: g.label,
        confidence: g.confidence,
        spokenResponse: language === 'zh' ? `检测到${g.label}` : `Detected ${g.label}`,
      }))
    }

    return {
      sceneCandidates,
      objectCandidates,
      gestures,
      analyzedAt: Date.now(),
      shouldUseCloud:
        isVisualQuestion(normalized) &&
        !hasConfidentCandidate(sceneCandidates, defaultLocalVisionThresholds.sceneConfidence) &&
        !hasConfidentCandidate(objectCandidates, defaultLocalVisionThresholds.objectConfidence) &&
        !hasConfidentGesture(gestures, defaultLocalVisionThresholds.gestureConfidence),
    }
  }
}
