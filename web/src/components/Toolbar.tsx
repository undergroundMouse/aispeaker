import { useCallback, useEffect, useState } from 'react'
import { appCore } from '../core/bootstrap'
import { eventBus } from '../core/event-bus'
import { MEDIA_EVENTS, type ConversationState, type StreamState } from '../core/media/types'

export function Toolbar() {
  const [streamState, setStreamState] = useState<StreamState>(
    appCore.mediaStreamManager.getState(),
  )
  const [conversationState, setConversationState] = useState<ConversationState>(
    appCore.conversationManager.getState(),
  )
  const [frameCount, setFrameCount] = useState(0)

  useEffect(() => {
    const unsubStream = eventBus.on<StreamState>(MEDIA_EVENTS.STREAM_STATE, setStreamState)
    const unsubFrames = eventBus.on(MEDIA_EVENTS.FRAME_RAW, () => {
      setFrameCount((n) => n + 1)
    })
    return () => {
      unsubStream()
      unsubFrames()
    }
  }, [])

  const cameraOn = streamState.status === 'active' || streamState.status === 'starting'

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

  const cycleConversation = useCallback(() => {
    const order: ConversationState[] = ['idle', 'listening', 'thinking', 'speaking']
    const idx = order.indexOf(conversationState)
    const next = order[(idx + 1) % order.length]
    appCore.conversationManager.setState(next)
    setConversationState(next)
  }, [conversationState])

  return (
    <header className="toolbar">
      <h1 className="toolbar__title">AISpeaker</h1>
      <div className="toolbar__actions">
        <button type="button" className="toolbar__btn" onClick={toggleCamera}>
          {cameraOn ? '关闭摄像头' : '打开摄像头'}
        </button>
        <button type="button" className="toolbar__btn toolbar__btn--secondary" onClick={cycleConversation}>
          对话状态: {conversationState}
        </button>
        <span className="toolbar__stats">已采集帧: {frameCount}</span>
      </div>
    </header>
  )
}
