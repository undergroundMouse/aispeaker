import { CloudGateway } from './cloud/CloudGateway'
import { ConversationManager } from './conversation/ConversationManager'
import { LocalInferenceEngine } from './inference/LocalInferenceEngine'
import { LocalLongTermMemoryStore } from './memory/LongTermMemoryStore'
import { FrameSampler } from './media/FrameSampler'
import { MediaStreamManager } from './media/MediaStreamManager'
import { MEDIA_EVENTS, type StreamState } from './media/types'
import { LanguageStore } from './i18n/LanguageStore'
import { NetworkMonitor } from './network/NetworkMonitor'
import { LocalCommandRouter } from './voice/LocalCommandRouter'
import { VoiceInputManager } from './voice/VoiceInputManager'
import { eventBus } from './event-bus'

class AppCore {
  private static readonly activeUserId = 'local-user'

  readonly mediaStreamManager = new MediaStreamManager()
  readonly frameSampler = new FrameSampler()
  readonly conversationManager = new ConversationManager()
  readonly voiceInputManager = new VoiceInputManager(this.conversationManager)
  readonly localInferenceEngine = new LocalInferenceEngine()
  readonly languageStore = new LanguageStore()
  readonly networkMonitor = new NetworkMonitor()
  readonly longTermMemoryStore = new LocalLongTermMemoryStore()
  readonly cloudGateway = new CloudGateway(
    this.conversationManager,
    this.networkMonitor,
    this.languageStore,
    undefined,
    undefined,
    this.longTermMemoryStore,
  )
  readonly localCommandRouter = new LocalCommandRouter(
    this.conversationManager,
    this.cloudGateway,
    this.languageStore,
  )

  private streamUnsubscribe?: () => void

  init(): void {
    this.localInferenceEngine.start()
    this.networkMonitor.start()
    this.cloudGateway.start()
    this.localCommandRouter.start()
    void this.seedDemoLongTermMemories()

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

  private async seedDemoLongTermMemories(): Promise<void> {
    const existing = await this.longTermMemoryStore.list(AppCore.activeUserId)
    if (existing.length > 0 || !this.longTermMemoryStore.isAvailable()) return

    await this.longTermMemoryStore.create(AppCore.activeUserId, {
      type: 'preference',
      summary: 'User likes red objects.',
      subject: 'red objects',
      value: 'liked',
      tags: ['red', 'color', 'preference'],
      syncEligible: true,
    })
    await this.longTermMemoryStore.create(AppCore.activeUserId, {
      type: 'object-location',
      summary: 'The coffee cup is usually on the desk.',
      subject: 'coffee cup',
      value: 'desk',
      tags: ['coffee', 'cup', 'desk'],
    })
  }
}

export const appCore = new AppCore()
