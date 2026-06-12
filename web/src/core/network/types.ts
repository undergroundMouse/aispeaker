export type NetworkState = 'online' | 'weak' | 'offline'

export const NETWORK_EVENTS = {
  STATE: 'network:state',
  RETRY_PROMPT: 'network:retry-prompt',
} as const

export interface NetworkStatePayload {
  state: NetworkState
}

export interface NetworkRetryPrompt {
  message: string
  timestamp: number
}
