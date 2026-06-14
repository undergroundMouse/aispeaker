import type { ClientSessionMessage, ServerSessionMessage } from '@ai/shared'

export function encodeClientMessage(message: ClientSessionMessage): string {
  return JSON.stringify(message)
}

export function decodeServerMessage(data: string): ServerSessionMessage | null {
  try {
    return JSON.parse(data) as ServerSessionMessage
  } catch {
    return null
  }
}

export function decodeClientMessage(data: string): ClientSessionMessage | null {
  try {
    return JSON.parse(data) as ClientSessionMessage
  } catch {
    return null
  }
}

export const HEARTBEAT_INTERVAL_MS = 15_000
export const RECONNECT_BASE_MS = 500
export const RECONNECT_MAX_MS = 5_000
export const SESSION_RESUME_TTL_MS = 300_000
