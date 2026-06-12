import { useCallback, useEffect, useMemo, useState } from 'react'
import { appCore } from '../core/bootstrap'
import { eventBus } from '../core/event-bus'
import { LANGUAGE_EVENTS, type LanguageChangedPayload } from '../core/i18n/LanguageStore'
import { getMessages } from '../core/i18n/messages'
import { MEDIA_EVENTS, type ConversationState, type StreamState } from '../core/media/types'
import {
  NETWORK_EVENTS,
  type NetworkRetryPrompt,
  type NetworkStatePayload,
} from '../core/network/types'
import {
  LOCAL_COMMAND_EVENTS,
  VOICE_EVENTS,
  type LocalCommandResult,
  type VoiceInputState,
  type VoiceTranscript,
} from '../core/voice/types'

export function Toolbar() {
  const [language, setLanguage] = useState(appCore.languageStore.getLanguage())
  const [streamState, setStreamState] = useState<StreamState>(
    appCore.mediaStreamManager.getState(),
  )
  const [conversationState, setConversationState] = useState<ConversationState>(
    appCore.conversationManager.getState(),
  )
  const [voiceState, setVoiceState] = useState<VoiceInputState>(
    appCore.voiceInputManager.getState(),
  )
  const [lastTranscript, setLastTranscript] = useState('')
  const [localCommandMessage, setLocalCommandMessage] = useState('')
  const [networkState, setNetworkState] = useState(appCore.networkMonitor.getState())
  const [retryMessage, setRetryMessage] = useState('')
  const [frameCount, setFrameCount] = useState(0)
  const text = useMemo(() => getMessages(language), [language])

  useEffect(() => {
    const unsubStream = eventBus.on<StreamState>(MEDIA_EVENTS.STREAM_STATE, setStreamState)
    const unsubFrames = eventBus.on(MEDIA_EVENTS.FRAME_RAW, () => {
      setFrameCount((n) => n + 1)
    })
    const unsubVoice = eventBus.on<VoiceInputState>(VOICE_EVENTS.STATE, setVoiceState)
    const unsubTranscript = eventBus.on<VoiceTranscript>(
      VOICE_EVENTS.TRANSCRIPT_FINAL,
      (payload) => setLastTranscript(payload.text),
    )
    const unsubLocalCommand = eventBus.on<LocalCommandResult>(
      LOCAL_COMMAND_EVENTS.EXECUTED,
      (payload) => setLocalCommandMessage(payload.message),
    )
    const unsubNetwork = eventBus.on<NetworkStatePayload>(NETWORK_EVENTS.STATE, (payload) => {
      setNetworkState(payload.state)
    })
    const unsubRetry = eventBus.on<NetworkRetryPrompt>(NETWORK_EVENTS.RETRY_PROMPT, (payload) => {
      setRetryMessage(payload.message)
    })
    const unsubLanguage = eventBus.on<LanguageChangedPayload>(LANGUAGE_EVENTS.CHANGED, (payload) => {
      setLanguage(payload.language)
      setRetryMessage('')
    })
    return () => {
      unsubStream()
      unsubFrames()
      unsubVoice()
      unsubTranscript()
      unsubLocalCommand()
      unsubNetwork()
      unsubRetry()
      unsubLanguage()
    }
  }, [])

  const cameraOn = streamState.status === 'active' || streamState.status === 'starting'
  const voiceOn = voiceState.status !== 'disabled'

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      appCore.mediaStreamManager.stop()
    } else {
      try {
        await appCore.mediaStreamManager.start()
      } catch {
        // error state emitted by manager
      }
    }
  }, [cameraOn])

  const toggleVoice = useCallback(async () => {
    if (voiceOn) {
      appCore.voiceInputManager.disable()
    } else {
      try {
        await appCore.voiceInputManager.enable()
      } catch {
        // error state emitted by manager
      }
    }
  }, [voiceOn])

  const toggleWake = useCallback(async () => {
    if (voiceState.wakeEnabled) {
      appCore.voiceInputManager.disableWake()
      return
    }
    await appCore.voiceInputManager.enableWake()
  }, [voiceState.wakeEnabled])

  const startTalk = useCallback(() => {
    appCore.voiceInputManager.startPressToTalk()
  }, [])

  const stopTalk = useCallback(() => {
    appCore.voiceInputManager.stopPressToTalk()
  }, [])

  const cycleConversation = useCallback(() => {
    const order: ConversationState[] = ['idle', 'listening', 'thinking', 'speaking']
    const idx = order.indexOf(conversationState)
    const next = order[(idx + 1) % order.length]
    appCore.conversationManager.setState(next)
    setConversationState(next)
  }, [conversationState])

  const voiceStatusLabel =
    voiceState.error?.message ??
    ({
      disabled: text.voiceDisabled,
      'permission-requested': text.voicePermission,
      ready: text.voiceReady,
      'wake-listening': text.voiceWake,
      recording: text.voiceRecording,
      transcribing: text.voiceTranscribing,
      error: text.voiceError,
    }[voiceState.status] ?? voiceState.status)

  return (
    <header className="toolbar">
      <h1 className="toolbar__title">{text.title}</h1>
      <div className="toolbar__actions">
        <button type="button" className="toolbar__btn" onClick={toggleCamera}>
          {cameraOn ? text.cameraOn : text.cameraOff}
        </button>
        <button type="button" className="toolbar__btn" onClick={toggleVoice}>
          {voiceOn ? text.voiceOn : text.voiceOff}
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--secondary"
          onClick={toggleWake}
          disabled={!voiceOn}
        >
          {voiceState.wakeEnabled ? text.wakeOn : text.wakeOff}
        </button>
        <button
          type="button"
          className={`toolbar__btn toolbar__btn--talk${voiceState.status === 'recording' ? ' toolbar__btn--talk-active' : ''}`}
          disabled={!voiceOn || voiceState.status === 'transcribing'}
          onMouseDown={startTalk}
          onMouseUp={stopTalk}
          onMouseLeave={stopTalk}
          onTouchStart={startTalk}
          onTouchEnd={stopTalk}
        >
          {voiceState.status === 'recording' ? text.talkStop : text.talkStart}
        </button>
        <button type="button" className="toolbar__btn toolbar__btn--secondary" onClick={cycleConversation}>
          {text.conversation}: {conversationState}
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--secondary"
          onClick={() => appCore.cloudGateway.simulateWeakNetwork()}
        >
          {text.simulateWeak}
        </button>
        <span className="toolbar__stats">
          {text.network}: {networkState}
        </span>
        <span className="toolbar__stats">
          {text.voice}: {voiceStatusLabel}
        </span>
        {lastTranscript && (
          <span className="toolbar__stats toolbar__stats--transcript">
            {text.recent}: {lastTranscript}
          </span>
        )}
        {localCommandMessage && (
          <span className="toolbar__stats toolbar__stats--local">
            {text.local}: {localCommandMessage}
          </span>
        )}
        {retryMessage && (
          <span className="toolbar__stats toolbar__stats--retry">{retryMessage}</span>
        )}
        <span className="toolbar__stats">
          {text.frames}: {frameCount}
        </span>
      </div>
    </header>
  )
}
