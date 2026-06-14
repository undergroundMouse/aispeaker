import type { AppLanguage } from './index.js'

export type RealtimeSessionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type FullDuplexState = 'idle' | 'listening' | 'speaking' | 'barge-in' | 'recovering'

export type RouteTier = 'local-only' | 'edge-first' | 'cloud-full' | 'degraded'

export type FramePolicy = 'minimal' | 'reduced' | 'normal' | 'active'

export interface TrackedObject {
  trackId: string
  label: string
  confidence: number
  region: { x: number; y: number; width: number; height: number; label?: string }
  lastSeenAt: number
}

export interface OcrRegion {
  text: string
  region: { x: number; y: number; width: number; height: number }
  confidence: number
}

export interface VisionDelta {
  trackedObjects: TrackedObject[]
  sceneChange: boolean
  gestures: Array<{ type: string; label: string; confidence: number }>
  ocrRegions: OcrRegion[]
  frameSeq: number
  capturedAt: number
}

export interface SessionStartPayload {
  conversationId: string
  language: AppLanguage
  capabilities: string[]
  privacy: {
    cloudMediaTransmission: boolean
    microphoneCapture: boolean
    cameraCapture: boolean
  }
}

export interface SessionReadyPayload {
  sessionId: string
  resumeToken: string
}

export interface RouteDecisionPayload {
  tier: RouteTier
  framePolicy: FramePolicy
  reason: string
  estimatedCost: number
}

export interface SessionErrorPayload {
  code: string
  message: string
  recoverable: boolean
}

export type ClientSessionMessage =
  | { type: 'session.start'; payload: SessionStartPayload }
  | { type: 'session.resume'; payload: { resumeToken: string; lastAckSeq: number } }
  | { type: 'audio.chunk'; seq: number; vadState: 'speech' | 'silence' | 'unknown' }
  | { type: 'video.frame'; seq: number; width: number; height: number; capturedAt: number }
  | { type: 'vision.delta'; seq: number; delta: VisionDelta }
  | { type: 'barge-in'; at: number; reason: string }
  | { type: 'heartbeat'; at: number }
  | { type: 'ack'; seq: number }

export type ServerSessionMessage =
  | { type: 'session.ready'; payload: SessionReadyPayload }
  | { type: 'asr.interim'; text: string; confidence: number }
  | { type: 'asr.final'; text: string; turnId: string }
  | { type: 'tts.chunk'; seq: number; audioBase64: string }
  | { type: 'tts.end'; turnId: string }
  | { type: 'vision.hint'; regions: Array<{ x: number; y: number; width: number; height: number; label?: string }> }
  | { type: 'route.decision'; payload: RouteDecisionPayload }
  | { type: 'session.error'; payload: SessionErrorPayload }
  | { type: 'heartbeat'; at: number }
  | { type: 'ack'; seq: number }

export const REALTIME_SESSION_PATH = '/api/v1/realtime/session'
