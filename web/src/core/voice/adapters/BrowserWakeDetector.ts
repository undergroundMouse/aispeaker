import type { WakeDetector } from './types'

export class BrowserWakeDetector implements WakeDetector {
  private wakeHandlers = new Set<() => void>()
  private unavailableHandlers = new Set<() => void>()

  isSupported(): boolean {
    return false
  }

  async start(_phrase: string): Promise<void> {
    for (const handler of this.unavailableHandlers) handler()
  }

  stop(): void {
    // no-op until a real wake engine is integrated
  }

  onWake(handler: () => void): () => void {
    this.wakeHandlers.add(handler)
    return () => this.wakeHandlers.delete(handler)
  }

  onUnavailable(handler: () => void): () => void {
    this.unavailableHandlers.add(handler)
    return () => this.unavailableHandlers.delete(handler)
  }
}
