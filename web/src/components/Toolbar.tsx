import { useCallback, useEffect, useState } from 'react'
import { appCore } from '../core/bootstrap'
import { eventBus } from '../core/event-bus'
import { MEDIA_EVENTS, type ConversationState, type StreamState } from '../core/media/types'
import {
  LOCAL_COMMAND_EVENTS,
  VOICE_EVENTS,
  type LocalCommandResult,
  type VoiceInputState,
  type VoiceTranscript,
} from '../core/voice/types'

export function Toolbar() {
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
  const [frameCount, setFrameCount] = useState(0)

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
    return () => {
      unsubStream()
      unsubFrames()
      unsubVoice()
      unsubTranscript()
      unsubLocalCommand()
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
      disabled: '已关闭',
      'permission-requested': '请求权限中',
      ready: '就绪',
      'wake-listening': '唤醒监听中',
      recording: '录音中',
      transcribing: '识别中',
      error: '异常',
    }[voiceState.status] ?? voiceState.status)

  return (
    <header className="toolbar">
      <h1 className="toolbar__title">AISpeaker</h1>
      <div className="toolbar__actions">
        <button type="button" className="toolbar__btn" onClick={toggleCamera}>
          {cameraOn ? '关闭摄像头' : '打开摄像头'}
        </button>
        <button type="button" className="toolbar__btn" onClick={toggleVoice}>
          {voiceOn ? '关闭麦克风' : '打开麦克风'}
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--secondary"
          onClick={toggleWake}
          disabled={!voiceOn}
        >
          {voiceState.wakeEnabled ? '关闭唤醒' : '开启唤醒'}
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
          {voiceState.status === 'recording' ? '松开结束' : '按住说话'}
        </button>
        <button type="button" className="toolbar__btn toolbar__btn--secondary" onClick={cycleConversation}>
          对话状态: {conversationState}
        </button>
        <span className="toolbar__stats">语音: {voiceStatusLabel}</span>
        {lastTranscript && (
          <span className="toolbar__stats toolbar__stats--transcript">最近: {lastTranscript}</span>
        )}
        {localCommandMessage && (
          <span className="toolbar__stats toolbar__stats--local">本地: {localCommandMessage}</span>
        )}
        <span className="toolbar__stats">已采集帧: {frameCount}</span>
      </div>
    </header>
  )
}
