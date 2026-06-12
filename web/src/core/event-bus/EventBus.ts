type EventHandler<T = unknown> = (payload: T) => void

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)
    return () => this.off(event, handler)
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler as EventHandler)
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.handlers.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      handler(payload)
    }
  }
}

export const eventBus = new EventBus()
