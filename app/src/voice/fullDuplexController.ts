import type { FullDuplexState } from '@ai/shared'

export interface FullDuplexControllerOptions {
  onStateChange?: (state: FullDuplexState) => void
  onBargeIn?: () => void
  bargeInThreshold?: number
}

export class FullDuplexController {
  private state: FullDuplexState = 'idle'
  private readonly options: FullDuplexControllerOptions

  constructor(options: FullDuplexControllerOptions = {}) {
    this.options = options
  }

  getState(): FullDuplexState {
    return this.state
  }

  startListening(): void {
    this.setState('listening')
  }

  startSpeaking(): void {
    this.setState('speaking')
  }

  handleUserSpeechDuringTts(micRms: number): void {
    const threshold = this.options.bargeInThreshold ?? 0.04
    if (this.state === 'speaking' && micRms >= threshold) {
      this.setState('barge-in')
      this.options.onBargeIn?.()
    }
  }

  finishSpeaking(): void {
    this.setState(this.state === 'barge-in' ? 'listening' : 'idle')
  }

  recover(): void {
    this.setState('recovering')
    window.setTimeout(() => this.setState('listening'), 100)
  }

  private setState(state: FullDuplexState): void {
    this.state = state
    this.options.onStateChange?.(state)
  }
}
