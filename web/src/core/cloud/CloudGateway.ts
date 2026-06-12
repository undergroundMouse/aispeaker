import { eventBus } from '../event-bus'
import { MEDIA_EVENTS, type ThumbnailFrame } from '../media/types'

export class CloudGateway {
  private unsubscribe?: () => void
  private latestThumbnail: ThumbnailFrame | null = null

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
}
