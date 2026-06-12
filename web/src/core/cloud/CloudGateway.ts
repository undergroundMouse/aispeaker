import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import type { LanguageStore } from '../i18n/LanguageStore'
import { getMessages } from '../i18n/messages'
import type { NetworkMonitor } from '../network/NetworkMonitor'
import { NETWORK_EVENTS, type NetworkRetryPrompt } from '../network/types'
import { MEDIA_EVENTS, type ThumbnailFrame } from '../media/types'
import type { VoiceTurn } from '../voice/types'

export class CloudGateway {
  private unsubscribe?: () => void
  private latestThumbnail: ThumbnailFrame | null = null
  private readonly conversationManager?: ConversationManager
  private readonly networkMonitor?: NetworkMonitor
  private readonly languageStore?: LanguageStore

  constructor(
    conversationManager?: ConversationManager,
    networkMonitor?: NetworkMonitor,
    languageStore?: LanguageStore,
  ) {
    this.conversationManager = conversationManager
    this.networkMonitor = networkMonitor
    this.languageStore = languageStore
  }

  start(): void {
    this.unsubscribe = eventBus.on<ThumbnailFrame>(
      MEDIA_EVENTS.FRAME_THUMBNAIL,
      (frame) => {
        this.latestThumbnail = frame
      },
    )
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.latestThumbnail = null
  }

  getLatestThumbnail(): ThumbnailFrame | null {
    return this.latestThumbnail
  }

  submitComplexTurn(turn: VoiceTurn): void {
    if (this.networkMonitor && !this.networkMonitor.canSubmitComplexRequest()) {
      const language = this.languageStore?.getLanguage() ?? 'zh'
      const payload: NetworkRetryPrompt = {
        message: getMessages(language).retryNetwork,
        timestamp: Date.now(),
      }
      eventBus.emit(NETWORK_EVENTS.RETRY_PROMPT, payload)
      this.conversationManager?.setState('idle')
      return
    }

    this.conversationManager?.setState('thinking')
    console.debug('[CloudGateway] complex turn queued', turn.turnId, turn.text)
    this.conversationManager?.setState('idle')
  }

  simulateWeakNetwork(): void {
    this.networkMonitor?.markCloudFailure()
  }

  capturePhoto(): boolean {
    const frame = this.latestThumbnail
    if (!frame) return false

    const url = URL.createObjectURL(frame.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `aispeaker-${frame.timestamp}.jpg`
    anchor.click()
    URL.revokeObjectURL(url)
    return true
  }
}
