export type AppLanguage = 'zh' | 'en'

export type VisualAnswerKind = 'object' | 'scene' | 'gesture' | 'general' | 'clarification' | 'network-error'

export type VisualAnswerSource = 'local' | 'cloud' | 'memory' | 'custom-object-memory' | 'system'

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

export interface GestureDetection {
  label: string
  confidence: number
}

export interface LocalVisionHints {
  objectCandidates: VisionCandidate[]
  sceneCandidates: VisionCandidate[]
  gestures: GestureDetection[]
}

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

export interface CloudMediaConsent {
  cloudMediaTransmission: boolean
  cloudMemoryAccess: boolean
}

export interface CloudVisualAnswerFrame {
  dataUrl: string
  width: number
  height: number
  capturedAt: number
}

export interface CloudVisualAnswerRequest {
  conversationId: string
  transcript: string
  language: AppLanguage
  consent: CloudMediaConsent
  frame?: CloudVisualAnswerFrame | null
  localVisionHints: LocalVisionHints
  longTermMemoryContext?: string | null
}

export interface CloudRequestTelemetry {
  estimatedTokens: number
  actualTokens?: number
  estimatedCost: number
}

export type CloudGatewayFailureReason = 'network' | 'budget-exceeded' | 'provider-error'

export interface CloudVisualAnswerSuccessResponse {
  ok: true
  answer: VisualAnswer
  telemetry: CloudRequestTelemetry
}

export interface CloudVisualAnswerFailureResponse {
  ok: false
  reason: CloudGatewayFailureReason
  message: string
  telemetry: CloudRequestTelemetry
}

export type CloudVisualAnswerResponse = CloudVisualAnswerSuccessResponse | CloudVisualAnswerFailureResponse

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

export interface UpdateBudgetRequest {
  dailyBudgetCap: number | null
}

export type CloudAuthorityMode = 'client' | 'shadow' | 'server'

export const API_ROUTES = {
  health: '/health',
  cloudVisualAnswer: '/api/v1/cloud/visual-answer',
  adminConversations: '/api/v1/admin/conversations',
  adminConversation: '/api/v1/admin/conversations/:conversationId',
  adminBudget: '/api/v1/admin/budget',
  adminDailySpend: '/api/v1/admin/daily-spend',
} as const

export const BUDGET_EXCEEDED_MESSAGE_ZH = '今日云端预算已用尽'
export const NETWORK_FAILURE_MESSAGE_ZH = '网络不佳，请重试'
