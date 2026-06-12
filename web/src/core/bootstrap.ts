import { CloudGateway } from './cloud/CloudGateway'
import { ConversationManager } from './conversation/ConversationManager'
import { LocalInferenceEngine } from './inference/LocalInferenceEngine'
import { FrameSampler } from './media/FrameSampler'
import { MediaStreamManager } from './media/MediaStreamManager'
import { MEDIA_EVENTS, type StreamState } from './media/types'
import { NetworkMonitor } from './network/NetworkMonitor'
import { LocalCommandRouter } from './voice/LocalCommandRouter'
import { VoiceInputManager } from './voice/VoiceInputManager'
import { eventBus } from './event-bus'

class AppCore {
  readonly mediaStreamManager = new MediaStreamManager()
  readonly frameSampler = new FrameSampler()
  readonly conversationManager = new ConversationManager()
  readonly voiceInputManager = new VoiceInputManager(this.conversationManager)
  readonly localInferenceEngine = new LocalInferenceEngine()
  readonly networkMonitor = new NetworkMonitor()
  readonly cloudGateway = new CloudGateway(this.conversationManager, this.networkMonitor)
  readonly localCommandRouter = new LocalCommandRouter(
    this.conversationManager,
    this.cloudGateway,
  )

  private streamUnsubscribe?: () => void

  init(): void {
    this.localInferenceEngine.start()
    this.networkMonitor.start()
    this.cloudGateway.start()
    this.localCommandRouter.start()

    this.streamUnsubscribe = eventBus.on<StreamState>(
      MEDIA_EVENTS.STREAM_STATE,
      (state) => {
        if (state.status === 'active' && state.stream) {
          this.frameSampler.start(state.stream)
        } else {
          this.frameSampler.stop()
        }
      },
    )
  }

  destroy(): void {
    this.streamUnsubscribe?.()
    this.frameSampler.stop()
    this.mediaStreamManager.stop()
    this.voiceInputManager.destroy()
    this.localCommandRouter.stop()
    this.localInferenceEngine.stop()
    this.cloudGateway.stop()
    this.networkMonitor.stop()
  }
}

export const appCore = new AppCore()
