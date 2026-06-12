export type StreamStatus = 'inactive' | 'starting' | 'active' | 'error'

export type CameraErrorCode =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_busy'
  | 'unknown'

export interface StreamState {
  status: StreamStatus
  stream: MediaStream | null
  error?: {
    code: CameraErrorCode
    message: string
  }
}

export interface MediaFrame {
  frameId: number
  timestamp: number
  imageData: ImageData
  width: number
  height: number
}

export interface ThumbnailFrame {
  frameId: number
  timestamp: number
  blob: Blob
  width: 224
  height: 224
}

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'

export const MEDIA_EVENTS = {
  STREAM_STATE: 'media:stream:state',
  FRAME_RAW: 'media:frame:raw',
  FRAME_THUMBNAIL: 'media:frame:thumbnail',
} as const

export const CONVERSATION_EVENTS = {
  STATE_CHANGED: 'conversation:stateChanged',
} as const

export const SAMPLING_INTERVALS = {
  ACTIVE_MS: 500,
  IDLE_MS: 2000,
  IDLE_THRESHOLD_MS: 10_000,
} as const
