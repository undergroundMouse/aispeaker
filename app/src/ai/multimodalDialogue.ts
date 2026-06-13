import type {
  AppLanguage,
  CloudVisualLanguageProvider,
  CustomObjectFeatureExtractor,
  CustomObjectStore,
  LongTermMemoryPromptContext,
  LocalVisionAnalyzer,
  LocalVisionSignals,
  MediaPrivacyConsent,
  MultimodalDialogueRequest,
  MultimodalDialogueResult,
  VisualAnswer,
  VisionCandidate,
} from '../types'
import { stripMediaForCloud, withEphemeralFrameAsync } from '../media/ephemeralMedia'
import { isCloudMediaTransmissionAuthorized } from '../media/mediaPrivacy'
import { getUnavailableCloudMessage } from '../voice/cloudFailureMessages'
import { emptyConversationMemory, resolveFollowUpReference, updateConversationMemory } from './conversationMemory'
import { MockCloudVisualLanguageProvider, normalizeProviderVisualAnswer } from './cloudVisualLanguage'
import {
  PrototypeCustomObjectFeatureExtractor,
  customObjectToCandidate,
  searchCustomObjects,
} from './customObjects'
import { recordCloudRoutingOutcome, type EdgeCloudMetricsSession } from './edgeCloudMetrics'
import { formatLongTermMemoryPrompt } from './longTermMemory'
import {
  defaultLocalVisionThresholds,
  getTopCandidate,
  getTopGesture,
  isObjectQuestion,
  isSceneQuestion,
} from './localVision'
import { buildWhyFollowUpAnswer, finalizeVisualAnswer } from './visualEvidence'

export interface MultimodalDialogueServiceOptions {
  localVisionAnalyzer: LocalVisionAnalyzer
  cloudProvider?: CloudVisualLanguageProvider
  customObjectStore?: CustomObjectStore
  customObjectFeatureExtractor?: CustomObjectFeatureExtractor
  onCloudRoutingOutcome?: (outcome: 'local-short-circuit' | 'cloud-invoked') => void
}

export class MultimodalDialogueService {
  private readonly localVisionAnalyzer: LocalVisionAnalyzer
  private readonly cloudProvider: CloudVisualLanguageProvider
  private readonly customObjectStore?: CustomObjectStore
  private readonly customObjectFeatureExtractor: CustomObjectFeatureExtractor
  private readonly onCloudRoutingOutcome?: (outcome: 'local-short-circuit' | 'cloud-invoked') => void

  constructor({
    localVisionAnalyzer,
    cloudProvider = new MockCloudVisualLanguageProvider(),
    customObjectStore,
    customObjectFeatureExtractor = new PrototypeCustomObjectFeatureExtractor(),
    onCloudRoutingOutcome,
  }: MultimodalDialogueServiceOptions) {
    this.localVisionAnalyzer = localVisionAnalyzer
    this.cloudProvider = cloudProvider
    this.customObjectStore = customObjectStore
    this.customObjectFeatureExtractor = customObjectFeatureExtractor
    this.onCloudRoutingOutcome = onCloudRoutingOutcome
  }

  async handleTurn(request: MultimodalDialogueRequest): Promise<MultimodalDialogueResult> {
    return withEphemeralFrameAsync(request.frame, async (frame) => {
      const memory = request.memory ?? emptyConversationMemory()
      const localVision = await this.localVisionAnalyzer.analyze({
        frame,
        transcript: request.transcript,
        language: request.language,
      })

      const longTermMemoryContext = await buildLongTermMemoryContext(request, localVision)

      const whyFollowUpAnswer = buildWhyFollowUpAnswer(request.transcript, memory, request.language)
      if (whyFollowUpAnswer) {
        this.recordOutcome('local-short-circuit')
        return completeResult(whyFollowUpAnswer, localVision, memory, longTermMemoryContext)
      }

      const customObjectAnswer = await this.buildCustomObjectAnswer({ ...request, frame }, localVision)
      if (customObjectAnswer) {
        this.recordOutcome('local-short-circuit')
        return completeResult(customObjectAnswer, localVision, memory, longTermMemoryContext)
      }

      const localAnswer = buildLocalAnswer({ ...request, frame }, localVision, longTermMemoryContext)
      if (localAnswer) {
        this.recordOutcome('local-short-circuit')
        return completeResult(localAnswer, localVision, memory, longTermMemoryContext)
      }

      const memoryAnswer = buildMemoryAnswer(request)
      if (memoryAnswer) {
        this.recordOutcome('local-short-circuit')
        return completeResult(memoryAnswer, localVision, memory, longTermMemoryContext)
      }

      if (request.networkState !== 'online') {
        return completeResult(
          finalizeVisualAnswer(
            {
              kind: 'network-error',
              answer: getUnavailableCloudMessage(request.language, request.networkState),
              source: 'system',
              referencedEntities: [],
              regions: [],
              evidenceAvailable: false,
              requiresSpeech: true,
            },
            request.language,
          ),
          localVision,
          memory,
          longTermMemoryContext,
        )
      }

      const cloudMemoryContext = request.longTermMemory?.consent.cloudMemoryAccess
        ? longTermMemoryContext
        : undefined
      const cloudFrame = resolveCloudFrame(frame, request.mediaPrivacy)
      this.recordOutcome('cloud-invoked')
      const cloudAnswer = await this.cloudProvider.answerVisualQuestion(
        stripMediaForCloud(
          {
            transcript: request.transcript,
            frame: cloudFrame,
            localVision,
            memory,
            longTermMemoryContext: cloudMemoryContext,
            language: request.language,
          },
          isCloudMediaTransmissionAuthorized(request.mediaPrivacy ?? defaultCloudMediaConsent()),
        ),
      )

      return completeResult(
        normalizeProviderVisualAnswer(cloudAnswer, request.language),
        localVision,
        memory,
        longTermMemoryContext,
      )
    })
  }

  private recordOutcome(outcome: 'local-short-circuit' | 'cloud-invoked'): void {
    this.onCloudRoutingOutcome?.(outcome)
  }

  private async buildCustomObjectAnswer(
    request: MultimodalDialogueRequest,
    localVision: LocalVisionSignals,
  ): Promise<VisualAnswer | null> {
    if (!this.customObjectStore) {
      return null
    }

    const normalized = request.transcript.trim().toLocaleLowerCase()
    if (!isObjectQuestion(normalized)) {
      return null
    }

    const candidateRegion = request.selectedObjectRegion ?? getTopCandidate(localVision.objectCandidates)?.region
    const match = await searchCustomObjects({
      frame: request.frame,
      region: candidateRegion,
      store: this.customObjectStore,
      extractor: this.customObjectFeatureExtractor,
    })

    if (!match) {
      return null
    }

    const candidate = customObjectToCandidate(match)
    return finalizeVisualAnswer(
      {
        kind: 'object',
        answer: answerObject(candidate, request.language),
        source: 'custom-object-memory',
        confidence: candidate.confidence,
        referencedEntities: [candidate],
        regions: candidate.region ? [candidate.region] : [],
        requiresSpeech: true,
      },
      request.language,
    )
  }
}

function defaultCloudMediaConsent(): MediaPrivacyConsent {
  return {
    cameraCapture: true,
    microphoneCapture: true,
    cloudMediaTransmission: false,
  }
}

function resolveCloudFrame(
  frame: MultimodalDialogueRequest['frame'],
  consent?: MediaPrivacyConsent,
): MultimodalDialogueRequest['frame'] {
  if (!isCloudMediaTransmissionAuthorized(consent ?? defaultCloudMediaConsent())) {
    return null
  }

  return frame
}

function buildLocalAnswer(
  request: MultimodalDialogueRequest,
  localVision: LocalVisionSignals,
  longTermMemoryContext?: LongTermMemoryPromptContext,
): VisualAnswer | null {
  const normalized = request.transcript.trim().toLocaleLowerCase()
  const gesture = getTopGesture(localVision.gestures)
  if (gesture) {
    return finalizeVisualAnswer(
      {
        kind: 'gesture',
        answer: gesture.spokenResponse,
        source: 'local',
        confidence: gesture.confidence,
        referencedEntities: [{ label: gesture.label, confidence: gesture.confidence }],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      request.language,
    )
  }

  if (isObjectQuestion(normalized)) {
    const object = getTopCandidate(localVision.objectCandidates, defaultLocalVisionThresholds.objectConfidence)
    if (object) {
      const preference = findMemoryForCandidate(longTermMemoryContext, object.label, 'preference')
      return finalizeVisualAnswer(
        {
          kind: 'object',
          answer: preference
            ? answerObjectWithMemory(object, preference.summary, request.language)
            : answerObject(object, request.language),
          source: 'local',
          confidence: object.confidence,
          referencedEntities: [object],
          regions: object.region ? [object.region] : [],
          requiresSpeech: true,
        },
        request.language,
      )
    }
  }

  if (isSceneQuestion(normalized)) {
    if (!request.frame) {
      return null
    }

    const scene = getTopCandidate(localVision.sceneCandidates, defaultLocalVisionThresholds.sceneConfidence)
    if (scene) {
      return finalizeVisualAnswer(
        {
          kind: 'scene',
          answer: answerScene(scene, request.language),
          source: 'local',
          confidence: scene.confidence,
          referencedEntities: [scene],
          regions: scene.region ? [scene.region] : [],
          requiresSpeech: true,
        },
        request.language,
      )
    }
  }

  return null
}

function buildMemoryAnswer(request: MultimodalDialogueRequest): VisualAnswer | null {
  const referenced = resolveFollowUpReference(request.transcript, request.memory)
  if (!referenced) {
    return null
  }

  return finalizeVisualAnswer(
    {
      kind:
        referenced.kind === 'object' || referenced.kind === 'scene' || referenced.kind === 'gesture'
          ? referenced.kind
          : 'general',
      answer:
        request.language === 'zh'
          ? `你刚才提到的是 ${referenced.label}。`
          : `You were referring to ${referenced.label}.`,
      source: 'memory',
      confidence: referenced.confidence,
      referencedEntities: [
        {
          label: referenced.label,
          confidence: referenced.confidence ?? 1,
          region: referenced.region,
        },
      ],
      regions: referenced.region ? [referenced.region] : [],
      requiresSpeech: true,
    },
    request.language,
  )
}

function completeResult(
  answer: VisualAnswer,
  localVision: LocalVisionSignals,
  memory: MultimodalDialogueRequest['memory'],
  longTermMemoryContext?: LongTermMemoryPromptContext,
): MultimodalDialogueResult {
  return {
    answer,
    localVision,
    memory: updateConversationMemory(memory, answer),
    longTermMemoryContext,
  }
}

function answerObject(object: VisionCandidate, language: AppLanguage): string {
  return language === 'zh' ? `这是 ${object.label}。` : `This is ${object.label}.`
}

function answerObjectWithMemory(object: VisionCandidate, memorySummary: string, language: AppLanguage): string {
  return language === 'zh'
    ? `这是 ${object.label}。我记得：${memorySummary}`
    : `This is ${object.label}. I remember: ${memorySummary}`
}

function answerScene(scene: VisionCandidate, language: AppLanguage): string {
  return language === 'zh' ? `你现在可能在 ${scene.label}。` : `You appear to be in a ${scene.label}.`
}

async function buildLongTermMemoryContext(
  request: MultimodalDialogueRequest,
  localVision: LocalVisionSignals,
): Promise<LongTermMemoryPromptContext | undefined> {
  if (!request.longTermMemory?.store.isAvailable()) {
    return undefined
  }

  const visualLabels = [...localVision.objectCandidates, ...localVision.sceneCandidates, ...localVision.gestures].map(
    (candidate) => candidate.label,
  )
  const recentConversationLabels = request.memory.entries.map((entry) => entry.label)
  const memories = await request.longTermMemory.store.retrieveRelevant({
    userId: request.longTermMemory.userId,
    transcript: request.transcript,
    visualLabels,
    recentConversationLabels,
  })

  if (memories.length === 0) {
    return undefined
  }

  return {
    memories,
    promptText: formatLongTermMemoryPrompt(memories),
    cloudAuthorized: request.longTermMemory.consent.cloudMemoryAccess,
  }
}

function findMemoryForCandidate(
  context: LongTermMemoryPromptContext | undefined,
  label: string,
  type: LongTermMemoryPromptContext['memories'][number]['type'],
) {
  const normalizedLabel = label.toLocaleLowerCase()
  return context?.memories.find(
    (memory) =>
      memory.type === type &&
      [memory.summary, memory.subject, memory.value, ...memory.tags]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalizedLabel)),
  )
}

export function applyEdgeCloudMetrics(
  session: EdgeCloudMetricsSession,
  outcome: 'local-short-circuit' | 'cloud-invoked',
): EdgeCloudMetricsSession {
  return recordCloudRoutingOutcome(session, outcome)
}
