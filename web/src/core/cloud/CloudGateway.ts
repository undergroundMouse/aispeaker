import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import { MEDIA_EVENTS, type ThumbnailFrame } from '../media/types'
import type { VoiceTurn } from '../voice/types'

export class CloudGateway {
  private unsubscribe?: () => void
  private latestThumbnail: ThumbnailFrame | null = null
  private readonly conversationManager?: ConversationManager

  constructor(conversationManager?: ConversationManager) {
    this.conversationManager = conversationManager
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
    this.conversationManager?.setState('thinking')
    console.debug('[CloudGateway] complex turn queued', turn.turnId, turn.text)
    this.conversationManager?.setState('idle')
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
