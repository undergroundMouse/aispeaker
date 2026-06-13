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

export type VisionCandidateSource = 'local-vision' | 'custom-object-memory' | 'cloud'

export interface VisionCandidate {
  label: string
  confidence: number
  region?: VisionRegion
  source?: VisionCandidateSource
  customObjectId?: string
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

export type VisualAnswerSource = 'local' | 'cloud' | 'memory' | 'custom-object-memory' | 'system'

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
  longTermMemoryContext?: LongTermMemoryPromptContext
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
  longTermMemory?: LongTermMemoryTurnContext
}

export interface MultimodalDialogueResult {
  answer: VisualAnswer
  localVision: LocalVisionSignals
  memory: ConversationMemoryState
  longTermMemoryContext?: LongTermMemoryPromptContext
}

export type LongTermMemoryType = 'preference' | 'object-location' | 'habit' | 'fact'

export interface LongTermMemoryRecord {
  id: string
  userId: string
  type: LongTermMemoryType
  summary: string
  details?: string
  subject?: string
  value?: string
  tags: string[]
  strength: number
  syncEligible: boolean
  createdAt: number
  updatedAt: number
  lastUsedAt: number
  weakenedAt?: number
}

export interface LongTermMemoryCreateInput {
  type: LongTermMemoryType
  summary: string
  details?: string
  subject?: string
  value?: string
  tags?: string[]
  syncEligible?: boolean
}

export interface LongTermMemoryRetrievalInput {
  userId: string
  transcript: string
  visualLabels: string[]
  recentConversationLabels: string[]
  now?: number
  limit?: number
}

export interface LongTermMemoryConsentSettings {
  cloudMemoryAccess: boolean
  cloudSummarySync: boolean
}

export interface LongTermMemoryPromptContext {
  memories: LongTermMemoryRecord[]
  promptText: string
  cloudAuthorized: boolean
}

export interface LongTermMemoryTurnContext {
  userId: string
  store: LongTermMemoryStore
  consent: LongTermMemoryConsentSettings
}

export interface LongTermMemorySyncSummary {
  id: string
  type: LongTermMemoryType
  summary: string
  tags: string[]
  lastUsedAt: number
  strength: number
}

export interface LongTermMemoryStoreStatus {
  available: boolean
  message: string | null
}

export interface LongTermMemoryStore {
  create(userId: string, input: LongTermMemoryCreateInput, now?: number): Promise<LongTermMemoryRecord>
  correct(
    userId: string,
    id: string,
    input: Partial<LongTermMemoryCreateInput>,
    now?: number,
  ): Promise<LongTermMemoryRecord | null>
  list(userId: string): Promise<LongTermMemoryRecord[]>
  delete(userId: string, id: string): Promise<boolean>
  forgetAll(userId: string): Promise<void>
  retrieveRelevant(input: LongTermMemoryRetrievalInput): Promise<LongTermMemoryRecord[]>
  reinforce(userId: string, ids: string[], now?: number): Promise<void>
  weakenStale(userId: string, now?: number): Promise<LongTermMemoryRecord[]>
  createSyncSummaries(
    userId: string,
    consent: LongTermMemoryConsentSettings,
  ): Promise<LongTermMemorySyncSummary[]>
  isAvailable(): boolean
  getStatus(): LongTermMemoryStoreStatus
}

export const CUSTOM_OBJECT_EVENTS = {
  RECOGNIZED: 'vision:custom-object:recognized',
  REGION_SELECTED: 'vision:custom-object:region-selected',
} as const

export interface CustomObjectRecognizedPayload {
  candidate: VisionCandidate
  answer: string
  timestamp: number
}

export interface CustomObjectRegionSelectedPayload {
  region: VisionRegion
  timestamp: number
}

export interface CustomObjectFeatureVector {
  values: number[]
  model: string
  dimensions: number
}

export interface CustomObjectRegionMetadata extends VisionRegion {
  frameWidth: number
  frameHeight: number
}

export interface CustomObjectRecord {
  id: string
  name: string
  vectors: CustomObjectFeatureVector[]
  region: CustomObjectRegionMetadata
  createdAt: number
  updatedAt: number
  source: 'voice-region-teaching' | 'remember-prompt'
}

export interface CustomObjectSearchResult {
  record: CustomObjectRecord
  similarity: number
}

export interface CustomObjectStore {
  insert(record: Omit<CustomObjectRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomObjectRecord>
  search(
    vector: CustomObjectFeatureVector,
    options?: { threshold?: number; limit?: number },
  ): Promise<CustomObjectSearchResult[]>
  list(): Promise<CustomObjectRecord[]>
  delete(id: string): Promise<boolean>
  deleteLastTeaching(): Promise<CustomObjectRecord | null>
  isAvailable(): boolean
}

export interface CustomObjectFeatureExtractor {
  model: string
  isAvailable(): boolean
  extract(input: {
    frame: ThumbnailFrame
    region?: VisionRegion
    nameHint?: string
  }): Promise<CustomObjectFeatureVector>
}
