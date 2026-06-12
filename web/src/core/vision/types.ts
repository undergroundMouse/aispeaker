import type { AppLanguage } from '../i18n/messages'
import type { ThumbnailFrame } from '../media/types'
import type { NetworkState } from '../network/types'

export interface VisionRegion {
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export interface VisionCandidate {
  label: string
  confidence: number
  region?: VisionRegion
}

export type GestureType = 'raised-hand' | 'nod'

export interface GestureDetection {
  type: GestureType
  label: string
  confidence: number
  spokenResponse: string
}

export interface LocalVisionSignals {
  sceneCandidates: VisionCandidate[]
  objectCandidates: VisionCandidate[]
  gestures: GestureDetection[]
  analyzedAt: number
  shouldUseCloud: boolean
}

export interface LocalVisionThresholds {
  sceneConfidence: number
  objectConfidence: number
  gestureConfidence: number
}

export interface LocalVisionAnalysisInput {
  frame: ThumbnailFrame | null
  transcript: string
  language: AppLanguage
}

export interface LocalVisionAnalyzer {
  analyze(input: LocalVisionAnalysisInput): Promise<LocalVisionSignals>
}

export type VisualAnswerKind =
  | 'object'
  | 'scene'
  | 'gesture'
  | 'general'
  | 'clarification'
  | 'network-error'

export type VisualAnswerSource = 'local' | 'cloud' | 'memory' | 'system'

export interface VisualAnswer {
  kind: VisualAnswerKind
  answer: string
  source: VisualAnswerSource
  confidence?: number
  referencedEntities: VisionCandidate[]
  regions: VisionRegion[]
  requiresSpeech: boolean
}

export type ConversationMemoryKind = 'object' | 'scene' | 'gesture' | 'topic' | 'answer'

export interface ConversationMemoryEntry {
  id: string
  kind: ConversationMemoryKind
  label: string
  confidence?: number
  createdAt: number
  region?: VisionRegion
}

export interface ConversationMemoryState {
  entries: ConversationMemoryEntry[]
}

export interface CloudVisualQuestionRequest {
  transcript: string
  frame: ThumbnailFrame | null
  localVision: LocalVisionSignals
  memory: ConversationMemoryState
  language: AppLanguage
}

export interface CloudVisualLanguageProvider {
  answerVisualQuestion(request: CloudVisualQuestionRequest): Promise<VisualAnswer>
}

export interface MultimodalDialogueRequest {
  transcript: string
  frame: ThumbnailFrame | null
  networkState: NetworkState
  language: AppLanguage
  memory: ConversationMemoryState
}

export interface MultimodalDialogueResult {
  answer: VisualAnswer
  localVision: LocalVisionSignals
  memory: ConversationMemoryState
}
