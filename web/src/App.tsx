import { useCallback, useState } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { mediaStreamManager } from './core/media/MediaStreamManager'
import './App.css'

function App() {
  const [cameraOn, setCameraOn] = useState(false)

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

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="toolbar__title">AISpeaker</h1>
        <button type="button" className="toolbar__btn" onClick={toggleCamera}>
          {cameraOn ? '关闭摄像头' : '打开摄像头'}
        </button>
      </header>
      <main className="app__main">
        <CameraPreview />
      </main>
    </div>
  )
}

export default App
