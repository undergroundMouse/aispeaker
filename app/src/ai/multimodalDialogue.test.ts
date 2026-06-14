import { describe, expect, it, vi } from 'vitest'
import type { CloudVisualLanguageProvider, VisualAnswer } from '../types'
import type { SampledVideoFrame } from '../types'
import { emptyConversationMemory } from './conversationMemory'
import { LocalCustomObjectStore, PrototypeCustomObjectFeatureExtractor, teachCustomObject } from './customObjects'
import { InMemoryLongTermMemoryDriver, LocalLongTermMemoryStore } from './longTermMemory'
import { MockLocalVisionAnalyzer } from './localVision'
import { MultimodalDialogueService } from './multimodalDialogue'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

const cupCandidate = {
  label: 'cup',
  confidence: 0.9,
  region: { x: 0.32, y: 0.28, width: 0.26, height: 0.36, label: 'cup' },
}

function createService(analyzer = new MockLocalVisionAnalyzer()) {
  return new MultimodalDialogueService({ localVisionAnalyzer: analyzer })
}

function createCloudSpyProvider(): CloudVisualLanguageProvider & { answerVisualQuestion: ReturnType<typeof vi.fn> } {
  const answer: VisualAnswer = {
    kind: 'object',
    answer: 'The cloud visual model identifies cup.',
    source: 'cloud',
    confidence: 0.7,
    referencedEntities: [{ label: 'cup', confidence: 0.7 }],
    regions: [],
    evidenceAvailable: false,
    requiresSpeech: true,
  }

  return {
    answerVisualQuestion: vi.fn(async () => answer),
  }
}

describe('MultimodalDialogueService', () => {
  it('uses visual context to answer ambiguous object questions', async () => {
    const result = await createService(
      new MockLocalVisionAnalyzer({
        objectCandidates: [cupCandidate],
      }),
    ).handleTurn({
      transcript: '这是什么',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(result.answer.kind).toBe('object')
    expect(result.answer.answer).toContain('cup')
    expect(result.memory.entries[0]?.label).toBe('cup')
  })

  it('routes default object questions to cloud when local mock has no object candidates', async () => {
    const cloudProvider = createCloudSpyProvider()

    const result = await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer(),
      cloudProvider,
    }).handleTurn({
      transcript: '这是什么',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(cloudProvider.answerVisualQuestion).toHaveBeenCalled()
    expect(result.answer.source).toBe('cloud')
  })

  it('answers scene questions locally when local vision is confident', async () => {
    const result = await createService(
      new MockLocalVisionAnalyzer({
        sceneCandidates: [{ label: 'office', confidence: 0.92 }],
      }),
    ).handleTurn({
      transcript: '我现在在哪类场景',
      frame,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(result.answer.kind).toBe('scene')
    expect(result.answer.source).toBe('local')
    expect(result.answer.answer).toContain('office')
  })

  it('rejects cloud-required visual questions during weak network', async () => {
    const result = await createService(
      new MockLocalVisionAnalyzer({
        objectCandidates: [{ label: 'cup', confidence: 0.2 }],
      }),
    ).handleTurn({
      transcript: 'what is this',
      frame,
      networkState: 'weak',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(result.answer.kind).toBe('network-error')
    expect(result.answer.answer).toBe('网络不稳定，请稍后再试。')
  })

  it('preserves context for follow-up references', async () => {
    const service = createService(
      new MockLocalVisionAnalyzer({
        objectCandidates: [cupCandidate],
      }),
    )
    const first = await service.handleTurn({
      transcript: 'what is this',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
    })

    const followUp = await service.handleTurn({
      transcript: 'what color is it',
      frame,
      networkState: 'online',
      language: 'en',
      memory: first.memory,
    })

    expect(followUp.answer.source).toBe('memory')
    expect(followUp.answer.answer).toContain('cup')
  })

  it('prioritizes local custom object memory over cloud recognition', async () => {
    const store = new LocalCustomObjectStore(null)
    const extractor = new PrototypeCustomObjectFeatureExtractor()
    const cloudProvider = createCloudSpyProvider()
    await teachCustomObject({
      transcript: 'remember this as travel mug',
      frame,
      region: { x: 0.32, y: 0.28, width: 0.26, height: 0.36 },
      store,
      extractor,
      language: 'en',
    })

    const result = await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({
        objectCandidates: [
          {
            label: 'cup',
            confidence: 0.2,
            region: { x: 0.32, y: 0.28, width: 0.26, height: 0.36 },
          },
        ],
      }),
      cloudProvider,
      customObjectStore: store,
      customObjectFeatureExtractor: extractor,
    }).handleTurn({
      transcript: 'what is this',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
    })

    expect(result.answer.source).toBe('custom-object-memory')
    expect(result.answer.answer).toContain('travel mug')
    expect(result.answer.referencedEntities[0]?.customObjectId).toBeTruthy()
    expect(cloudProvider.answerVisualQuestion).not.toHaveBeenCalled()
  })

  it('matches custom object memory from the selected region without local object candidates', async () => {
    const store = new LocalCustomObjectStore(null)
    const extractor = new PrototypeCustomObjectFeatureExtractor()
    const cloudProvider = createCloudSpyProvider()
    const selectedObjectRegion = { x: 0.32, y: 0.28, width: 0.26, height: 0.36 }
    await teachCustomObject({
      transcript: 'remember this as travel mug',
      frame,
      region: selectedObjectRegion,
      store,
      extractor,
      language: 'en',
    })

    const result = await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer(),
      cloudProvider,
      customObjectStore: store,
      customObjectFeatureExtractor: extractor,
    }).handleTurn({
      transcript: 'what is this',
      frame,
      selectedObjectRegion,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
    })

    expect(result.answer.source).toBe('custom-object-memory')
    expect(result.answer.answer).toContain('travel mug')
    expect(cloudProvider.answerVisualQuestion).not.toHaveBeenCalled()
  })

  it('falls back to cloud without prompting to remember objects', async () => {
    const cloudProvider = createCloudSpyProvider()
    const result = await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({
        objectCandidates: [{ label: 'cup', confidence: 0.2 }],
      }),
      cloudProvider,
      customObjectStore: new LocalCustomObjectStore(null),
      customObjectFeatureExtractor: new PrototypeCustomObjectFeatureExtractor(),
    }).handleTurn({
      transcript: 'what is this',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
    })

    expect(cloudProvider.answerVisualQuestion).toHaveBeenCalled()
    expect(result.answer.source).toBe('cloud')
    expect(result.answer.answer).not.toContain('remember it locally')
  })

  it('loads relevant long-term memory before local prompt construction', async () => {
    const longTermMemoryStore = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    await longTermMemoryStore.create('user-a', {
      type: 'preference',
      summary: 'User likes red cups.',
      subject: 'cup',
      tags: ['cup', 'red'],
    })

    const result = await createService(
      new MockLocalVisionAnalyzer({
        objectCandidates: [cupCandidate],
      }),
    ).handleTurn({
      transcript: 'what is this cup',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
      longTermMemory: {
        userId: 'user-a',
        store: longTermMemoryStore,
        consent: { cloudMemoryAccess: false, cloudSummarySync: false },
      },
    })

    expect(result.longTermMemoryContext?.promptText).toContain('User likes red cups.')
    expect(result.answer.answer).toContain('I remember: User likes red cups.')
  })

  it('excludes unauthorized long-term memory from cloud requests', async () => {
    const longTermMemoryStore = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    const cloudProvider = createCloudSpyProvider()
    await longTermMemoryStore.create('user-a', {
      type: 'preference',
      summary: 'User likes quiet explanations.',
      tags: ['quiet', 'explanations'],
    })

    await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({ objectCandidates: [] }),
      cloudProvider,
    }).handleTurn({
      transcript: 'tell me what is in the room with quiet explanations',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
      longTermMemory: {
        userId: 'user-a',
        store: longTermMemoryStore,
        consent: { cloudMemoryAccess: false, cloudSummarySync: false },
      },
    })

    expect(cloudProvider.answerVisualQuestion).toHaveBeenCalledWith(
      expect.not.objectContaining({ longTermMemoryContext: expect.anything() }),
    )
  })

  it('answers general questions through cloud without a camera frame', async () => {
    const cloudProvider = createCloudSpyProvider()
    cloudProvider.answerVisualQuestion.mockResolvedValue({
      kind: 'general',
      answer: '今天适合出门。',
      source: 'cloud',
      confidence: 0.8,
      referencedEntities: [],
      regions: [],
      evidenceAvailable: false,
      requiresSpeech: true,
    })

    const result = await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer(),
      cloudProvider,
    }).handleTurn({
      transcript: '今天天气怎么样',
      frame: null,
      networkState: 'online',
      language: 'zh',
      memory: emptyConversationMemory(),
    })

    expect(cloudProvider.answerVisualQuestion).toHaveBeenCalled()
    expect(result.answer.source).toBe('cloud')
    expect(result.answer.answer).toContain('出门')
  })

  it('includes scoped long-term memory in authorized complex cloud reasoning', async () => {
    const longTermMemoryStore = new LocalLongTermMemoryStore(new InMemoryLongTermMemoryDriver(), 'test-key')
    const cloudProvider = createCloudSpyProvider()
    await longTermMemoryStore.create('user-a', {
      type: 'preference',
      summary: 'User likes quiet explanations.',
      tags: ['quiet', 'explanations'],
    })

    await new MultimodalDialogueService({
      localVisionAnalyzer: new MockLocalVisionAnalyzer({ objectCandidates: [] }),
      cloudProvider,
    }).handleTurn({
      transcript: 'tell me what is in the room with quiet explanations',
      frame,
      networkState: 'online',
      language: 'en',
      memory: emptyConversationMemory(),
      longTermMemory: {
        userId: 'user-a',
        store: longTermMemoryStore,
        consent: { cloudMemoryAccess: true, cloudSummarySync: false },
      },
    })

    expect(cloudProvider.answerVisualQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        longTermMemoryContext: expect.objectContaining({
          promptText: expect.stringContaining('quiet explanations'),
        }),
      }),
    )
  })
})
