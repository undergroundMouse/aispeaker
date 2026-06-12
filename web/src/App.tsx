import { useEffect, useMemo, useState } from 'react'
import { appCore } from './core/bootstrap'
import { CameraPreview } from './components/CameraPreview'
import { Toolbar } from './components/Toolbar'
import { LANGUAGE_EVENTS, type LanguageChangedPayload } from './core/i18n/LanguageStore'
import { getMessages } from './core/i18n/messages'
import { eventBus } from './core/event-bus'
import './App.css'

function App() {
  const [language, setLanguage] = useState(appCore.languageStore.getLanguage())
  const text = useMemo(() => getMessages(language), [language])

  useEffect(() => {
    appCore.init()
    const unsubLanguage = eventBus.on<LanguageChangedPayload>(LANGUAGE_EVENTS.CHANGED, (payload) => {
      setLanguage(payload.language)
    })
    return () => {
      unsubLanguage()
      appCore.destroy()
    }
  }, [])

  return (
    <div className="app">
      <Toolbar />
      <main className="app__main">
        <CameraPreview />
        <section className="app__hint">
          <p>{text.cameraHint1}</p>
          <p>{text.cameraHint2}</p>
          <p>{text.voiceHint}</p>
        </section>
      </main>
    </div>
  )
}

export default App
