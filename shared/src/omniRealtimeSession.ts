import type { AppLanguage } from './index.js'

export type OmniSessionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type OmniTurnDetectionType = 'server_vad' | 'semantic_vad'

export interface OmniSessionBootstrapPayload {
  conversationId: string
  language: AppLanguage
  instructions?: string
}

export interface OmniSessionReadyPayload {
  sessionId: string
  model: string
}

export interface OmniSessionErrorPayload {
  code: string
  message: string
  recoverable: boolean
}

/** Client → server proxy control messages (not forwarded upstream as-is). */
export type ClientOmniProxyMessage =
  | { type: 'session.bootstrap'; payload: OmniSessionBootstrapPayload }
  | { type: 'omni.event'; event: OmniUpstreamClientEvent }
  | { type: 'heartbeat'; at: number }

/** Server proxy → client control messages. */
export type ServerOmniProxyMessage =
  | { type: 'session.ready'; payload: OmniSessionReadyPayload }
  | { type: 'omni.event'; event: OmniUpstreamServerEvent }
  | { type: 'session.error'; payload: OmniSessionErrorPayload }
  | { type: 'heartbeat'; at: number }

/** Subset of upstream Omni Realtime client events relayed through the proxy. */
export type OmniUpstreamClientEvent =
  | { type: 'session.update'; event_id?: string; session: Record<string, unknown> }
  | { type: 'input_audio_buffer.append'; event_id?: string; audio: string }
  | { type: 'input_audio_buffer.commit'; event_id?: string }
  | { type: 'input_image_buffer.append'; event_id?: string; image: string }
  | { type: 'response.create'; event_id?: string }
  | { type: 'response.cancel'; event_id?: string }

/** Known upstream Omni Realtime server events surfaced to the client. */
export type OmniUpstreamServerEvent = Record<string, unknown> & { type: string }

export const OMNI_REALTIME_PATH = '/api/v1/realtime/omni'

export const OMNI_KNOWN_SERVER_EVENT_TYPES = [
  'session.created',
  'session.updated',
  'input_audio_buffer.speech_started',
  'input_audio_buffer.speech_stopped',
  'conversation.item.input_audio_transcription.delta',
  'conversation.item.input_audio_transcription.completed',
  'response.audio_transcript.delta',
  'response.audio_transcript.done',
  'response.audio.delta',
  'response.audio.done',
  'response.done',
  'error',
] as const

export const DEFAULT_OMNI_REALTIME_MODEL = 'qwen3.5-omni-plus-realtime'
export const DEFAULT_OMNI_REALTIME_BASE_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime'
export const DEFAULT_OMNI_VOICE = 'Cherry'
export const DEFAULT_OMNI_TURN_DETECTION: OmniTurnDetectionType = 'semantic_vad'

export const OMNI_INPUT_SAMPLE_RATE = 16_000
export const OMNI_OUTPUT_SAMPLE_RATE = 24_000
