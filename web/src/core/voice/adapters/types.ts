export interface SpeechRecognitionAdapter {
  isSupported(): boolean
  start(options?: { continuous?: boolean; interimResults?: boolean }): void
  stop(): void
  abort(): void
  onPartial(handler: (text: string) => void): () => void
  onFinal(handler: (text: string) => void): () => void
  onError(handler: (message: string) => void): () => void
}

export interface WakeDetector {
  isSupported(): boolean
  start(phrase: string): Promise<void>
  stop(): void
  onWake(handler: () => void): () => void
  onUnavailable(handler: () => void): () => void
}
