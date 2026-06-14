import type { VisionDelta } from '@ai/shared'
import type { SessionRecord } from './sessionStateStore.js'

export interface FullDuplexOrchestratorOptions {
  onAsrInterim: (text: string, confidence: number) => void
  onAsrFinal: (text: string, turnId: string) => void
  onTtsChunk: (seq: number, audioBase64: string) => void
  onTtsEnd: (turnId: string) => void
}

export class FullDuplexOrchestrator {
  private ttsActive = false
  private currentTurnId: string | null = null
  private ttsSeq = 0
  private readonly options: FullDuplexOrchestratorOptions

  constructor(options: FullDuplexOrchestratorOptions) {
    this.options = options
  }

  handleAudio(_session: SessionRecord, _pcm: Buffer): void {
    // ASR integration delegated to Paraformer session in route handler
  }

  emitAsrInterim(text: string, confidence = 0.8): void {
    this.options.onAsrInterim(text, confidence)
  }

  emitAsrFinal(text: string): void {
    const turnId = `turn-${Date.now()}`
    this.currentTurnId = turnId
    this.options.onAsrFinal(text, turnId)
  }

  startTts(turnId: string, text: string): void {
    this.ttsActive = true
    this.currentTurnId = turnId
    this.ttsSeq = 0
    const segments = text.split(/(?<=[。！？.!?])\s*/).filter(Boolean)
    for (const segment of segments) {
      this.ttsSeq += 1
      const audioBase64 = Buffer.from(segment, 'utf8').toString('base64')
      this.options.onTtsChunk(this.ttsSeq, audioBase64)
    }
    this.options.onTtsEnd(turnId)
    this.ttsActive = false
  }

  handleBargeIn(): void {
    if (this.ttsActive) {
      this.ttsActive = false
      this.currentTurnId = null
    }
  }

  isTtsActive(): boolean {
    return this.ttsActive
  }
}

export class ContinuousVisionService {
  private worldState: VisionDelta | null = null

  ingestDelta(delta: VisionDelta): VisionDelta {
    this.worldState = {
      ...delta,
      trackedObjects: delta.trackedObjects.slice(0, 20),
      ocrRegions: delta.ocrRegions.slice(0, 10),
    }
    return this.worldState
  }

  getWorldState(): VisionDelta | null {
    return this.worldState
  }
}
