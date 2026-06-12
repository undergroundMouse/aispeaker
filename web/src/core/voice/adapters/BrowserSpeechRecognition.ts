import type { SpeechRecognitionAdapter } from './types'

type BrowserSpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognitionCtor(): BrowserSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export class BrowserSpeechRecognition implements SpeechRecognitionAdapter {
  private recognition: SpeechRecognition | null = null
  private partialHandlers = new Set<(text: string) => void>()
  private finalHandlers = new Set<(text: string) => void>()
  private errorHandlers = new Set<(message: string) => void>()

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null
  }

  start(options?: { continuous?: boolean; interimResults?: boolean }): void {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      this.emitError('Speech recognition is not supported')
      return
    }

    this.abort()
    const recognition = new Ctor()
    recognition.lang = 'zh-CN'
    recognition.continuous = options?.continuous ?? false
    recognition.interimResults = options?.interimResults ?? true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalText += text
        } else {
          interim += text
        }
      }

      if (interim) {
        for (const handler of this.partialHandlers) handler(interim)
      }
      if (finalText.trim()) {
        for (const handler of this.finalHandlers) handler(finalText.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return
      this.emitError(event.error)
    }

    recognition.onend = () => {
      this.recognition = null
    }

    this.recognition = recognition
    recognition.start()
  }

  stop(): void {
    this.recognition?.stop()
  }

  abort(): void {
    if (!this.recognition) return
    this.recognition.onresult = null
    this.recognition.onerror = null
    this.recognition.onend = null
    this.recognition.abort()
    this.recognition = null
  }

  onPartial(handler: (text: string) => void): () => void {
    this.partialHandlers.add(handler)
    return () => this.partialHandlers.delete(handler)
  }

  onFinal(handler: (text: string) => void): () => void {
    this.finalHandlers.add(handler)
    return () => this.finalHandlers.delete(handler)
  }

  onError(handler: (message: string) => void): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  private emitError(message: string): void {
    for (const handler of this.errorHandlers) handler(message)
  }
}
