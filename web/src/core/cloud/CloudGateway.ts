import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import type { LanguageStore } from '../i18n/LanguageStore'
import { getMessages } from '../i18n/messages'
import type { NetworkMonitor } from '../network/NetworkMonitor'
import { NETWORK_EVENTS, type NetworkRetryPrompt } from '../network/types'
import { MEDIA_EVENTS, type ThumbnailFrame } from '../media/types'
import type { VoiceTurn } from '../voice/types'
import {
  LocalCustomObjectStore,
  PrototypeCustomObjectFeatureExtractor,
  createCustomObjectRecord,
  findCustomObjectCandidate,
} from '../vision/CustomObjectMemory'
import {
  LocalLongTermMemoryStore,
  formatLongTermMemoryPrompt,
} from '../memory/LongTermMemoryStore'
import {
  CUSTOM_OBJECT_EVENTS,
  type CustomObjectFeatureExtractor,
  type CustomObjectRecord,
  type CustomObjectRecognizedPayload,
  type CustomObjectStore,
  type LongTermMemoryConsentSettings,
  type LongTermMemoryPromptContext,
  type LongTermMemoryStore,
  type VisionRegion,
} from '../vision/types'

const DEFAULT_USER_ID = 'local-user'

export class CloudGateway {
  private unsubscribe?: () => void
  private latestThumbnail: ThumbnailFrame | null = null
  private readonly conversationManager?: ConversationManager
  private readonly networkMonitor?: NetworkMonitor
  private readonly languageStore?: LanguageStore
  private readonly customObjectStore: CustomObjectStore
  private readonly customObjectExtractor: CustomObjectFeatureExtractor
  private readonly longTermMemoryStore: LongTermMemoryStore
  private lastCustomObjectId: string | null = null
  private memoryConsent: LongTermMemoryConsentSettings = {
    cloudMemoryAccess: false,
    cloudSummarySync: false,
  }

  constructor(
    conversationManager?: ConversationManager,
    networkMonitor?: NetworkMonitor,
    languageStore?: LanguageStore,
    customObjectStore: CustomObjectStore = new LocalCustomObjectStore(),
    customObjectExtractor: CustomObjectFeatureExtractor = new PrototypeCustomObjectFeatureExtractor(),
    longTermMemoryStore: LongTermMemoryStore = new LocalLongTermMemoryStore(),
  ) {
    this.conversationManager = conversationManager
    this.networkMonitor = networkMonitor
    this.languageStore = languageStore
    this.customObjectStore = customObjectStore
    this.customObjectExtractor = customObjectExtractor
    this.longTermMemoryStore = longTermMemoryStore
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

  async teachCustomObject(name: string, region: VisionRegion): Promise<CustomObjectRecord | null> {
    if (!this.latestThumbnail || !name.trim()) return null

    const record = await createCustomObjectRecord({
      name: name.trim(),
      frame: this.latestThumbnail,
      region,
      store: this.customObjectStore,
      extractor: this.customObjectExtractor,
    })
    this.lastCustomObjectId = record.id
    return record
  }

  listCustomObjects(): Promise<CustomObjectRecord[]> {
    return this.customObjectStore.list()
  }

  async deleteCustomObject(id: string): Promise<boolean> {
    const deleted = await this.customObjectStore.delete(id)
    if (this.lastCustomObjectId === id) {
      this.lastCustomObjectId = null
    }
    return deleted
  }

  async submitComplexTurn(turn: VoiceTurn): Promise<void> {
    const language = this.languageStore?.getLanguage() ?? 'zh'
    const memoryContext = await this.buildLongTermMemoryContext(turn.text)
    const customObject = await findCustomObjectCandidate({
      frame: this.latestThumbnail,
      store: this.customObjectStore,
      extractor: this.customObjectExtractor,
    })

    if (customObject) {
      const answer =
        language === 'zh'
          ? `这是 ${customObject.label}。`
          : `This is ${customObject.label}.`
      const payload: CustomObjectRecognizedPayload = {
        candidate: customObject,
        answer,
        timestamp: Date.now(),
      }
      eventBus.emit(CUSTOM_OBJECT_EVENTS.RECOGNIZED, payload)
      this.lastCustomObjectId = customObject.customObjectId ?? null
      this.conversationManager?.setState('idle')
      return
    }

    if (this.networkMonitor && !this.networkMonitor.canSubmitComplexRequest()) {
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
    if (memoryContext?.cloudAuthorized) {
      console.debug('[CloudGateway] using authorized long-term memory context', memoryContext.promptText)
    } else if (memoryContext) {
      console.debug('[CloudGateway] long-term memory context kept local until user authorizes cloud access')
    }
    console.debug('[CloudGateway] ask whether to remember unknown objects locally')
    this.conversationManager?.setState('idle')
  }

  setLongTermMemoryConsent(consent: LongTermMemoryConsentSettings): void {
    this.memoryConsent = consent
  }

  getLongTermMemoryConsent(): LongTermMemoryConsentSettings {
    return { ...this.memoryConsent }
  }

  getLongTermMemoryStore(): LongTermMemoryStore {
    return this.longTermMemoryStore
  }

  simulateWeakNetwork(): void {
    this.networkMonitor?.markCloudFailure()
  }

  async forgetLastCustomObject(): Promise<boolean> {
    if (!this.lastCustomObjectId) return false

    const deleted = await this.customObjectStore.delete(this.lastCustomObjectId)
    if (deleted) {
      this.lastCustomObjectId = null
    }
    return deleted
  }

  async undoLastCustomObjectTeaching(): Promise<boolean> {
    const deleted = await this.customObjectStore.deleteLastTeaching()
    if (!deleted) return false

    if (this.lastCustomObjectId === deleted.id) {
      this.lastCustomObjectId = null
    }
    return true
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

  private async buildLongTermMemoryContext(transcript: string): Promise<LongTermMemoryPromptContext | null> {
    if (!this.longTermMemoryStore.isAvailable()) return null

    const visualLabels = this.latestThumbnail ? ['current camera frame'] : []
    const memories = await this.longTermMemoryStore.retrieveRelevant({
      userId: DEFAULT_USER_ID,
      transcript,
      visualLabels,
      recentConversationLabels: [],
    })
    if (memories.length === 0) return null

    return {
      memories,
      promptText: formatLongTermMemoryPrompt(memories),
      cloudAuthorized: this.memoryConsent.cloudMemoryAccess,
    }
  }
}
