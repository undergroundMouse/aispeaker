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

export const MEDIA_EVENTS = {
  STREAM_STATE: 'media:stream:state',
} as const
