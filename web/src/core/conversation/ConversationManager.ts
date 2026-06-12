import { eventBus } from '../event-bus'
import { CONVERSATION_EVENTS, type ConversationState } from '../media/types'

export class ConversationManager {
  private state: ConversationState = 'idle'

  getState(): ConversationState {
    return this.state
  }

  setState(state: ConversationState): void {
    if (this.state === state) return
    this.state = state
    eventBus.emit(CONVERSATION_EVENTS.STATE_CHANGED, { state })
  }
}
