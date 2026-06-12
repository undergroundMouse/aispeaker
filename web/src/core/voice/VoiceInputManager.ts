import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import { BrowserSpeechRecognition } from './adapters/BrowserSpeechRecognition'
import { BrowserWakeDetector } from './adapters/BrowserWakeDetector'
import type { SpeechRecognitionAdapter, WakeDetector } from './adapters/types'
import {
  DEFAULT_WAKE_PHRASE,
  VOICE_EVENTS,
  type VoiceInputState,
  type VoiceTranscript,
  type VoiceTurn,
  type VoiceTurnSource,
} from './types'
import { mapVoiceMediaError, VOICE_ERROR_MESSAGES } from './voiceErrors'

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  video: false,
}

export class VoiceInputManager {
  private stream: MediaStream | null = null
  private state: VoiceInputState = {
    status: 'disabled',
    wakeAvailable: false,
    wakeEnabled: false,
  }
  private turnCounter = 0
  private currentSource: VoiceTurnSource = 'press-to-talk'
  private pendingFinal = false
  private adapterUnsubs: Array<() => void> = []
  private readonly conversationManager: ConversationManager
  private readonly speech: SpeechRecognitionAdapter
  private readonly wake: WakeDetector

  constructor(
    conversationManager: ConversationManager,
    speech: SpeechRecognitionAdapter = new BrowserSpeechRecognition(),
    wake: WakeDetector = new BrowserWakeDetector(),
  ) {
    this.conversationManager = conversationManager
    this.speech = speech
    this.wake = wake
    this.bindAdapters()

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.disable())
    }
  }

  getState(): VoiceInputState {
    return this.state
  }

  async enable(): Promise<void> {
    if (this.state.status === 'permission-requested') return
    if (this.stream) {
      this.setState({
        status: 'ready',
        wakeAvailable: this.wake.isSupported(),
        wakeEnabled: this.state.wakeEnabled,
      })
      return
    }

    this.setState({
      status: 'permission-requested',
      wakeAvailable: this.wake.isSupported(),
      wakeEnabled: false,
      error: undefined,
    })

    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS)
      this.stream = stream
      this.setState({
        status: 'ready',
        wakeAvailable: this.wake.isSupported(),
        wakeEnabled: false,
        error: undefined,
      })
    } catch (err) {
      const mapped = mapVoiceMediaError(err)
      this.stream = null
      this.setState({
        status: 'error',
        wakeAvailable: this.wake.isSupported(),
        wakeEnabled: false,
        error: {
          code: mapped.code,
          message: VOICE_ERROR_MESSAGES[mapped.code],
        },
      })
      throw err
    }
  }

  disable(): void {
    this.wake.stop()
    this.speech.abort()
    this.stopStream()
    this.pendingFinal = false
    this.setState({
      status: 'disabled',
      wakeAvailable: this.wake.isSupported(),
      wakeEnabled: false,
      error: undefined,
    })
  }

  startPressToTalk(): void {
    if (!this.canCapture()) return
    if (this.state.status === 'recording' || this.state.status === 'transcribing') return

    this.currentSource = 'press-to-talk'
    this.pendingFinal = true
    this.conversationManager.setState('listening')
    this.setState({
      status: 'recording',
      wakeAvailable: this.state.wakeAvailable,
      wakeEnabled: this.state.wakeEnabled,
      error: undefined,
    })
    this.speech.start({ continuous: false, interimResults: true })
  }

  stopPressToTalk(): void {
    if (this.state.status !== 'recording') return
    this.setState({
      status: 'transcribing',
      wakeAvailable: this.state.wakeAvailable,
      wakeEnabled: this.state.wakeEnabled,
    })
    this.speech.stop()
  }

  async enableWake(): Promise<void> {
    if (!this.stream) {
      try {
        await this.enable()
      } catch {
        return
      }
    }

    if (!this.canCapture()) return

    this.setState({
      status: 'permission-requested',
      wakeAvailable: this.wake.isSupported(),
      wakeEnabled: false,
      error: undefined,
    })

    await this.wake.start(DEFAULT_WAKE_PHRASE)

    if (this.wake.isSupported()) {
      this.setState({
        status: 'wake-listening',
        wakeAvailable: true,
        wakeEnabled: true,
        error: undefined,
      })
    }
  }

  disableWake(): void {
    this.wake.stop()
    if (this.state.status === 'wake-listening') {
      this.setState({
        status: 'ready',
        wakeAvailable: this.state.wakeAvailable,
        wakeEnabled: false,
        error: undefined,
      })
    } else {
      this.patchState({ wakeEnabled: false })
    }
  }

  private bindAdapters(): void {
    this.adapterUnsubs.push(
      this.speech.onPartial((text) => {
        if (!text.trim()) return
        const payload: VoiceTranscript = {
          turnId: this.turnCounter + 1,
          timestamp: Date.now(),
          text: text.trim(),
          isFinal: false,
        }
        eventBus.emit(VOICE_EVENTS.TRANSCRIPT_PARTIAL, payload)
      }),
    )

    this.adapterUnsubs.push(
      this.speech.onFinal((text) => {
        if (!this.pendingFinal) return
        this.pendingFinal = false
        this.handleFinalTranscript(text)
      }),
    )

    this.adapterUnsubs.push(
      this.speech.onError(() => {
        if (!this.pendingFinal) return
        this.pendingFinal = false
        this.failTranscription()
      }),
    )

    this.adapterUnsubs.push(
      this.wake.onWake(() => {
        this.currentSource = 'wake'
        this.startPressToTalk()
      }),
    )

    this.adapterUnsubs.push(
      this.wake.onUnavailable(() => {
        this.patchState({
          wakeAvailable: false,
          wakeEnabled: false,
          error: {
            code: 'wake_unavailable',
            message: VOICE_ERROR_MESSAGES.wake_unavailable,
          },
        })
        if (this.state.status === 'permission-requested' || this.state.status === 'wake-listening') {
          this.setState({
            status: 'ready',
            wakeAvailable: false,
            wakeEnabled: false,
            error: {
              code: 'wake_unavailable',
              message: VOICE_ERROR_MESSAGES.wake_unavailable,
            },
          })
        }
      }),
    )
  }

  private handleFinalTranscript(text: string): void {
    const trimmed = text.trim()
    if (!trimmed) {
      this.failTranscription()
      return
    }

    this.turnCounter += 1
    const turn: VoiceTurn = {
      turnId: this.turnCounter,
      timestamp: Date.now(),
      text: trimmed,
      source: this.currentSource,
    }

    const transcript: VoiceTranscript = {
      turnId: turn.turnId,
      timestamp: turn.timestamp,
      text: turn.text,
      isFinal: true,
    }

    eventBus.emit(VOICE_EVENTS.TRANSCRIPT_FINAL, transcript)
    eventBus.emit(VOICE_EVENTS.TURN_SUBMITTED, turn)

    this.setState({
      status: this.state.wakeEnabled ? 'wake-listening' : 'ready',
      wakeAvailable: this.state.wakeAvailable,
      wakeEnabled: this.state.wakeEnabled,
      error: undefined,
    })
  }

  private failTranscription(): void {
    this.conversationManager.setState('idle')
    this.setState({
      status: this.state.wakeEnabled ? 'wake-listening' : 'ready',
      wakeAvailable: this.state.wakeAvailable,
      wakeEnabled: this.state.wakeEnabled,
      error: {
        code: 'transcription_failed',
        message: VOICE_ERROR_MESSAGES.transcription_failed,
      },
    })
  }

  private canCapture(): boolean {
    return (
      this.stream !== null &&
      this.state.status !== 'disabled' &&
      this.state.status !== 'permission-requested' &&
      this.state.status !== 'recording' &&
      this.state.status !== 'transcribing'
    )
  }

  private stopStream(): void {
    if (!this.stream) return
    for (const track of this.stream.getTracks()) {
      track.stop()
    }
    this.stream = null
  }

  private setState(next: VoiceInputState): void {
    this.state = next
    eventBus.emit(VOICE_EVENTS.STATE, { ...next })
  }

  private patchState(patch: Partial<VoiceInputState>): void {
    this.setState({ ...this.state, ...patch })
  }

  destroy(): void {
    for (const unsub of this.adapterUnsubs) unsub()
    this.adapterUnsubs = []
    this.disable()
  }
}
