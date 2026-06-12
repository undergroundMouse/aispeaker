export type VoiceInputStatus =
  | 'disabled'
  | 'permission-requested'
  | 'ready'
  | 'wake-listening'
  | 'recording'
  | 'transcribing'
  | 'error'

export type VoiceErrorCode =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_busy'
  | 'transcription_failed'
  | 'wake_unavailable'
  | 'unknown'

export type VoiceTurnSource = 'press-to-talk' | 'wake'

export interface VoiceInputState {
  status: VoiceInputStatus
  wakeAvailable: boolean
  wakeEnabled: boolean
  error?: {
    code: VoiceErrorCode
    message: string
  }
}

export interface VoiceTurn {
  turnId: number
  timestamp: number
  text: string
  source: VoiceTurnSource
}

export interface VoiceTranscript {
  turnId: number
  timestamp: number
  text: string
  isFinal: boolean
}

export const VOICE_EVENTS = {
  STATE: 'voice:state',
  TRANSCRIPT_PARTIAL: 'voice:transcript:partial',
  TRANSCRIPT_FINAL: 'voice:transcript:final',
  TURN_SUBMITTED: 'voice:turn:submitted',
} as const

export const LOCAL_COMMAND_EVENTS = {
  EXECUTED: 'voice:local-command:executed',
} as const

export type LocalCommandAction =
  | 'greet'
  | 'goodbye'
  | 'stop-dialogue'
  | 'take-photo'
  | 'switch-language'

export interface LocalCommandResult {
  action: LocalCommandAction
  phrase: string
  message: string
  handledLocally: true
  targetLanguage?: 'zh' | 'en'
}

export const DEFAULT_WAKE_PHRASE = '你好小助手'
