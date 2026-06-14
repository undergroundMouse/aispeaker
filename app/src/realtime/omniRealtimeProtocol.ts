import type { ClientOmniProxyMessage, ServerOmniProxyMessage } from '@ai/shared'

export function encodeClientOmniMessage(message: ClientOmniProxyMessage): string {
  return JSON.stringify(message)
}

export function decodeServerOmniMessage(data: string): ServerOmniProxyMessage | null {
  try {
    return JSON.parse(data) as ServerOmniProxyMessage
  } catch {
    return null
  }
}

export { HEARTBEAT_INTERVAL_MS, RECONNECT_BASE_MS, RECONNECT_MAX_MS } from './sessionProtocol'
