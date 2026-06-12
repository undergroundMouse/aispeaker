import { eventBus } from '../event-bus'
import { NETWORK_EVENTS, type NetworkState, type NetworkStatePayload } from './types'

const WEAK_WINDOW_MS = 30_000

export class NetworkMonitor {
  private state: NetworkState = 'online'
  private lastCloudFailureAt: number | null = null
  private onlineHandler = () => this.refresh()
  private offlineHandler = () => this.refresh()

  start(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', this.onlineHandler)
    window.addEventListener('offline', this.offlineHandler)
    this.refresh()
  }

  stop(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('online', this.onlineHandler)
    window.removeEventListener('offline', this.offlineHandler)
  }

  getState(): NetworkState {
    return this.state
  }

  markCloudFailure(now = Date.now()): void {
    this.lastCloudFailureAt = now
    this.refresh(now)
  }

  canSubmitComplexRequest(): boolean {
    return this.state === 'online'
  }

  private refresh(now = Date.now()): void {
    const next = this.deriveState(now)
    if (next === this.state) return

    this.state = next
    const payload: NetworkStatePayload = { state: next }
    eventBus.emit(NETWORK_EVENTS.STATE, payload)
  }

  private deriveState(now: number): NetworkState {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline'
    }

    if (this.lastCloudFailureAt && now - this.lastCloudFailureAt <= WEAK_WINDOW_MS) {
      return 'weak'
    }

    return 'online'
  }
}
