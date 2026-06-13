export type MediaStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'permission-denied'
  | 'unsupported'
  | 'device-error'

export type DeviceStatus = Exclude<MediaStatus, 'ready'> | 'ready'

export interface MediaCaptureState {
  status: MediaStatus
  cameraStatus: DeviceStatus
  microphoneStatus: DeviceStatus
  stream: MediaStream | null
  cameraStream: MediaStream | null
  microphoneStream: MediaStream | null
  errorMessage: string | null
}

export type SamplingMode = 'normal' | 'reduced' | 'paused'

export interface SampledVideoFrame {
  blob: Blob
  capturedAt: number
  width: number
  height: number
  mode: SamplingMode
}

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
  frame: SampledVideoFrame | null
  transcript: string
  language: AppLanguage
}

export interface LocalVisionAnalyzer {
  analyze: (input: LocalVisionAnalysisInput) => Promise<LocalVisionSignals>
}

export type ProactiveDetectionKind = 'object' | 'person' | 'action' | 'ocr'

export type ProactiveDetectorStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'failed'

export interface ProactiveOcrSignal {
  text: string
  hasContinuousDigits: boolean
  region?: VisionRegion
}

export interface ProactiveDetectorSignal {
  id: string
  kind: ProactiveDetectionKind
  label: string
  confidence: number
  detectedAt: number
  region?: VisionRegion
  trackId?: string
  ocr?: ProactiveOcrSignal
}

export interface ProactiveDetectionResult {
  status: ProactiveDetectorStatus
  capturedAt: number
  signals: ProactiveDetectorSignal[]
  errorMessage?: string
  source: 'mock' | 'tensorflow-js'
}

export interface ProactiveLocalDetector {
  getStatus: () => ProactiveDetectorStatus
  detect: (frame: SampledVideoFrame | null, now?: number) => Promise<ProactiveDetectionResult>
}

export type ProactivePromptSeverity = 'info' | 'reminder' | 'safety'

export type ProactivePromptPriority = 'normal' | 'urgent'

export type ProactivePromptSource = 'local-rules' | 'edge-detection' | 'cloud'

export type ProactiveReminderIntensity = 'normal' | 'more'

export interface ProactiveRuleMatch {
  ruleId: string
  promptKey: string
  message: string
  confidence: number
  severity: ProactivePromptSeverity
  priority: ProactivePromptPriority
  source: ProactivePromptSource
  labels: string[]
  regions: VisionRegion[]
  matchedAt: number
  requiresSensitiveSpeech?: boolean
}

export interface ProactivePromptCandidate {
  id: string
  ruleId: string
  promptKey: string
  text: string
  confidence: number
  severity: ProactivePromptSeverity
  priority: ProactivePromptPriority
  source: ProactivePromptSource
  labels: string[]
  regions: VisionRegion[]
  createdAt: number
}

export interface ProactivePromptSettings {
  enabled: boolean
  reminderIntensity: ProactiveReminderIntensity
  dailyCap: number
}

export interface ProactivePromptCounters {
  date: string
  dailyCount: number
  sessionStartedAt: number
  spokenAt: number[]
  lastPromptAtByKey: Record<string, number>
}

export interface ProactivePromptFeedback {
  ruleId: string
  promptKey: string
  labels: string[]
  createdAt: number
  penalty: number
}

export interface ProactivePromptState {
  settings: ProactivePromptSettings
  counters: ProactivePromptCounters
  feedback: ProactivePromptFeedback[]
  storageAvailable: boolean
}

export type VisualAnswerKind = 'object' | 'scene' | 'gesture' | 'general' | 'clarification' | 'network-error'

export type VisualAnswerSource = 'local' | 'cloud' | 'memory' | 'custom-object-memory' | 'system'

export interface VisualAnswer {
  kind: VisualAnswerKind
  answer: string
  source: VisualAnswerSource
  confidence?: number
  referencedEntities: VisionCandidate[]
  regions: VisionRegion[]
  explanation?: string
  evidenceAvailable: boolean
  requiresSpeech: boolean
}

export interface ActiveVisualEvidence {
  regions: VisionRegion[]
  explanation?: string
  capturedAt: number
  expiresAt: number
  evidenceAvailable: boolean
}

export type ConversationMemoryKind = 'object' | 'scene' | 'gesture' | 'topic' | 'answer'

export interface ConversationMemoryEntry {
  id: string
  kind: ConversationMemoryKind
  label: string
  confidence?: number
  createdAt: number
  region?: VisionRegion
  explanation?: string
  evidenceAvailable?: boolean
}

export interface ConversationMemoryState {
  entries: ConversationMemoryEntry[]
}

export interface CloudVisualQuestionRequest {
  transcript: string
  frame: SampledVideoFrame | null
  localVision: LocalVisionSignals
  memory: ConversationMemoryState
  longTermMemoryContext?: LongTermMemoryPromptContext
  language: AppLanguage
}

export interface CloudVisualLanguageProvider {
  answerVisualQuestion: (request: CloudVisualQuestionRequest) => Promise<VisualAnswer>
}

export interface MultimodalDialogueRequest {
  transcript: string
  frame: SampledVideoFrame | null
  networkState: NetworkState
  language: AppLanguage
  memory: ConversationMemoryState
  longTermMemory?: LongTermMemoryTurnContext
  mediaPrivacy?: MediaPrivacyConsent
  conversationId?: string
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

export interface LongTermMemoryPromptContext {
  memories: LongTermMemoryRecord[]
  promptText: string
  cloudAuthorized: boolean
}

export interface LongTermMemoryConsentSettings {
  cloudMemoryAccess: boolean
  cloudSummarySync: boolean
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
  create: (userId: string, input: LongTermMemoryCreateInput, now?: number) => Promise<LongTermMemoryRecord>
  correct: (
    userId: string,
    id: string,
    input: Partial<LongTermMemoryCreateInput>,
    now?: number,
  ) => Promise<LongTermMemoryRecord | null>
  list: (userId: string) => Promise<LongTermMemoryRecord[]>
  delete: (userId: string, id: string) => Promise<boolean>
  forgetAll: (userId: string) => Promise<void>
  retrieveRelevant: (input: LongTermMemoryRetrievalInput) => Promise<LongTermMemoryRecord[]>
  reinforce: (userId: string, ids: string[], now?: number) => Promise<void>
  weakenStale: (userId: string, now?: number) => Promise<LongTermMemoryRecord[]>
  createSyncSummaries: (userId: string, consent: LongTermMemoryConsentSettings) => Promise<LongTermMemorySyncSummary[]>
  isAvailable: () => boolean
  getStatus: () => LongTermMemoryStoreStatus
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
  insert: (record: Omit<CustomObjectRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomObjectRecord>
  search: (
    vector: CustomObjectFeatureVector,
    options?: { threshold?: number; limit?: number },
  ) => Promise<CustomObjectSearchResult[]>
  list: () => Promise<CustomObjectRecord[]>
  delete: (id: string) => Promise<boolean>
  deleteLastTeaching: () => Promise<CustomObjectRecord | null>
  isAvailable: () => boolean
}

export interface CustomObjectFeatureExtractor {
  model: string
  isAvailable: () => boolean
  extract: (input: {
    frame: SampledVideoFrame
    region?: VisionRegion
    nameHint?: string
  }) => Promise<CustomObjectFeatureVector>
}

export type CustomObjectTeachingStatus =
  | 'stored'
  | 'missing-frame'
  | 'missing-region'
  | 'missing-name'
  | 'memory-unavailable'
  | 'extractor-unavailable'

export interface CustomObjectTeachingResult {
  status: CustomObjectTeachingStatus
  record?: CustomObjectRecord
  message: string
}

export interface CustomObjectMemoryState {
  records: CustomObjectRecord[]
  lastMatchedId: string | null
  selectedRegion: VisionRegion | null
  lastTeachingRecordId: string | null
}

export type TtsProviderKind = 'web-speech' | 'cloud-streaming' | 'mock'

export type SpeechOutputStatus =
  | 'idle'
  | 'preparing'
  | 'speaking'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'unavailable'

export type TtsCancellationReason =
  | 'stop-command'
  | 'new-turn'
  | 'disabled'
  | 'unmount'
  | 'provider-error'
  | 'urgent-proactive-prompt'

export interface SpeechVoiceSettings {
  voiceName?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface TtsRequest {
  turnId: string
  text: string
  language: AppLanguage
  settings?: SpeechVoiceSettings
}

export type TtsEvent =
  | { type: 'start'; at: number; provider: TtsProviderKind }
  | { type: 'first-audio'; at: number; provider: TtsProviderKind }
  | { type: 'chunk'; at: number; provider: TtsProviderKind; text: string }
  | { type: 'end'; at: number; provider: TtsProviderKind }
  | { type: 'cancel'; at: number; provider: TtsProviderKind; reason: TtsCancellationReason }
  | { type: 'error'; at: number; provider: TtsProviderKind; message: string }

export interface TtsProviderCapabilities {
  kind: TtsProviderKind
  available: boolean
  local: boolean
  supportsStreaming: boolean
  supportsLanguage: boolean
  naturalnessMos?: number
}

export interface TtsProvider {
  kind: TtsProviderKind
  getCapabilities: (language: AppLanguage) => TtsProviderCapabilities
  speak: (request: TtsRequest) => AsyncIterable<TtsEvent>
  cancel: (reason: TtsCancellationReason) => void
}

export interface DialogueResponseSegment {
  turnId: string
  text: string
  isFinal: boolean
  receivedAt: number
}

export interface SpeechPlaybackState {
  status: SpeechOutputStatus
  provider: TtsProviderKind | null
  currentTurnId: string | null
  fallbackUsed: boolean
  errorMessage: string | null
  cancellationReason: TtsCancellationReason | null
}

export interface VoiceLatencyMetrics {
  turnId: string
  speechCaptureStartedAt?: number
  speechCaptureEndedAt?: number
  transcriptCommittedAt?: number
  aiFirstSegmentAt?: number
  ttsStartedAt?: number
  firstPlaybackAt?: number
  completedAt?: number
  responseLatencyMs?: number
  metThreeSecondRequirement?: boolean
  metTwoPointFiveSecondTarget?: boolean
}

export interface SpeechResponseResult {
  state: SpeechPlaybackState
  metrics: VoiceLatencyMetrics
  events: TtsEvent[]
}

export interface AsrEvaluationResult {
  expectedWords: number
  correctWords: number
  wordAccuracy: number
  passed: boolean
}

export interface TtsNaturalnessEvaluation {
  provider: TtsProviderKind
  mos: number
  passed: boolean
}

export type LocalCommandAction =
  | 'greet'
  | 'goodbye'
  | 'stop-dialogue'
  | 'take-photo'
  | 'switch-language'
  | 'forget-custom-object'
  | 'undo-custom-object-teaching'
  | 'disable-proactive-prompts'
  | 'increase-proactive-prompts'
  | 'proactive-prompt-wrong'

export type AppLanguage = 'zh' | 'en'

export interface LocalCommand {
  id: string
  action: LocalCommandAction
  phrases: string[]
  language?: AppLanguage
  targetLanguage?: AppLanguage
  requiresNetwork: false
}

export interface LocalCommandMatch {
  command: LocalCommand
  phrase: string
}

export interface MediaPrivacyConsent {
  cameraCapture: boolean
  microphoneCapture: boolean
  cloudMediaTransmission: boolean
}

export interface CloudGatewayRequestContext {
  conversationId: string
}

export interface CloudGatewaySuccessResult<T> {
  ok: true
  value: T
  estimatedTokens: number
  actualTokens?: number
  estimatedCost: number
}

export interface CloudGatewayFailureResult {
  ok: false
  reason: 'network' | 'budget-exceeded' | 'provider-error'
  message: string
  estimatedTokens: number
  estimatedCost: number
  error?: unknown
}

export type CloudGatewayResult<T> = CloudGatewaySuccessResult<T> | CloudGatewayFailureResult

export interface ConversationTelemetryRecord {
  conversationId: string
  estimatedTokens: number
  actualTokens?: number
  estimatedCost: number
  requestCount: number
  createdAt: number
  updatedAt: number
}

export interface OperationsBudgetConfig {
  dailyBudgetCap: number | null
  updatedAt: number
}

export type NetworkState = 'online' | 'weak' | 'offline'

export type DialogueTrigger = 'push-to-talk' | 'wake-word'

export interface DialogueEvent {
  trigger: DialogueTrigger
  transcript?: string
  startedAt: number
}
