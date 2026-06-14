import type { NetworkState } from '../types'

export interface NetworkHealthInput {
  online: boolean
  lastCloudRequestFailedAt?: number | null
  now?: number
  weakWindowMs?: number
}

export function deriveNetworkState({
  online,
  lastCloudRequestFailedAt = null,
  now = Date.now(),
  weakWindowMs = 30_000,
}: NetworkHealthInput): NetworkState {
  if (!online) {
    return 'offline'
  }

  if (lastCloudRequestFailedAt && now - lastCloudRequestFailedAt <= weakWindowMs) {
    return 'weak'
  }

  return 'online'
}

export function shouldBlockCloudRequest(networkState: NetworkState): boolean {
  return networkState === 'weak' || networkState === 'offline'
}
