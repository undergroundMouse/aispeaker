import { useCallback, useEffect, useState } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { eventBus } from './core/event-bus'
import { ConversationManager } from './core/conversation/ConversationManager'
import { FrameSampler } from './core/media/FrameSampler'
import { mediaStreamManager } from './core/media/MediaStreamManager'
import {
  MEDIA_EVENTS,
  type ConversationState,
  type StreamState,
} from './core/media/types'
import './App.css'

const conversationManager = new ConversationManager()
const frameSampler = new FrameSampler()

function App() {
  const [cameraOn, setCameraOn] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [frameCount, setFrameCount] = useState(0)

  useEffect(() => {
    const unsubStream = eventBus.on<StreamState>(MEDIA_EVENTS.STREAM_STATE, (state) => {
      if (state.status === 'active' && state.stream) frameSampler.start(state.stream)
      else frameSampler.stop()
    })
    const unsubFrames = eventBus.on(MEDIA_EVENTS.FRAME_RAW, () => setFrameCount((n) => n + 1))
    return () => {
      unsubStream()
      unsubFrames()
    }
  }, [])

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      mediaStreamManager.stop()
      setCameraOn(false)
    } else {
      try {
        await mediaStreamManager.start()
        setCameraOn(true)
      } catch {
        setCameraOn(false)
      }
    }
  }, [cameraOn])

  const cycleConversation = useCallback(() => {
    const order: ConversationState[] = ['idle', 'listening', 'thinking', 'speaking']
    const next = order[(order.indexOf(conversationState) + 1) % order.length]
    conversationManager.setState(next)
    setConversationState(next)
  }, [conversationState])

  return (
    <div className="app">
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
      <main className="app__main">
        <CameraPreview />
        <section className="app__hint">
          <p>对话中 2 fps，空闲 10 秒后降至 0.5 fps。</p>
        </section>
      </main>
    </div>
  )
}

export default App
