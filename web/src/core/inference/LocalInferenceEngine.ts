import { eventBus } from '../event-bus'
import { MEDIA_EVENTS, type MediaFrame } from '../media/types'

export class LocalInferenceEngine {
  private unsubscribe?: () => void
  private latestFrame: MediaFrame | null = null

  start(): void {
    this.unsubscribe = eventBus.on<MediaFrame>(MEDIA_EVENTS.FRAME_RAW, (frame) => {
      this.latestFrame = frame
      console.debug(
        '[LocalInferenceEngine] frame received',
        frame.frameId,
        `${frame.width}x${frame.height}`,
      )
    })
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.latestFrame = null
  }

  getLatestFrame(): MediaFrame | null {
    return this.latestFrame
  }
}
