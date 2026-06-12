import { useEffect } from 'react'
import { appCore } from './core/bootstrap'
import { CameraPreview } from './components/CameraPreview'
import { Toolbar } from './components/Toolbar'
import './App.css'

function App() {
  useEffect(() => {
    appCore.init()
    return () => appCore.destroy()
  }, [])

  return (
    <div className="app">
      <Toolbar />
      <main className="app__main">
        <CameraPreview />
        <section className="app__hint">
          <p>打开摄像头后，系统将按对话状态智能抽帧并送入 AI 处理链路。</p>
          <p>对话中 2 fps，空闲 10 秒后降至 0.5 fps。视频仅实时处理，不会持久化存储。</p>
          <p>打开麦克风后可按住说话，或尝试开启语音唤醒。语音仅实时识别，不会持久化存储。</p>
        </section>
      </main>
    </div>
  )
}

export default App
