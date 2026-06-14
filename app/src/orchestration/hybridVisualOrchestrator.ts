import type { VisionDelta } from '@ai/shared'
import type {
  AppLanguage,
  ConversationMemoryState,
  LocalVisionSignals,
  LongTermMemoryTurnContext,
  MediaPrivacyConsent,
  NetworkState,
  SampledVideoFrame,
  VisualAnswer,
} from '../types'
import { MultimodalDialogueService } from '../ai/multimodalDialogue'
import { isVisualQuestion } from '../ai/localVision'
import { resolveHybridRoute, type HybridRouteTier } from '../routing/adaptiveEdgeCloudRouter'

export interface HybridVisualOrchestratorOptions {
  dialogueService: MultimodalDialogueService
  getFrame: () => SampledVideoFrame | null
  getVisionDelta: () => VisionDelta | null
}

export interface HybridTurnContext {
  transcript: string
  language: AppLanguage
  networkState: NetworkState
  localVision: LocalVisionSignals
  mediaPrivacy: MediaPrivacyConsent
  conversationId: string
  memory: ConversationMemoryState
  longTermMemory?: LongTermMemoryTurnContext
  dailyBudgetRemaining?: number | null
  dailyBudgetCap?: number | null
}

export interface HybridTurnEnrichment {
  tier: HybridRouteTier
  hints?: string
  visualAnswer?: VisualAnswer
}

export class HybridVisualOrchestrator {
  private readonly options: HybridVisualOrchestratorOptions

  constructor(options: HybridVisualOrchestratorOptions) {
    this.options = options
  }

  resolveTier(context: HybridTurnContext): HybridRouteTier {
    return resolveHybridRoute({
      transcript: context.transcript,
      shouldUseCloud: context.localVision.shouldUseCloud,
      localVision: context.localVision,
      networkState: context.networkState,
      dailyBudgetRemaining: context.dailyBudgetRemaining ?? null,
      dailyBudgetCap: context.dailyBudgetCap ?? null,
      privacy: context.mediaPrivacy,
      dialogueActive: true,
    }).tier
  }

  buildVisionDeltaSummary(delta: VisionDelta | null, language: AppLanguage): string | undefined {
    if (!delta) {
      return undefined
    }

    const tracks = delta.trackedObjects
      .slice(0, 5)
      .map((track) => `${track.label}(${Math.round(track.confidence * 100)}%)`)
      .join(', ')
    const ocr = delta.ocrRegions
      .slice(0, 3)
      .map((region) => region.text)
      .join(', ')
    const gestures = delta.gestures.map((gesture) => gesture.label).join(', ')

    if (language === 'zh') {
      return [
        tracks ? `追踪物体: ${tracks}` : '',
        ocr ? `可见文字: ${ocr}` : '',
        gestures ? `手势: ${gestures}` : '',
        delta.sceneChange ? '场景发生变化' : '',
      ]
        .filter(Boolean)
        .join('；')
    }

    return [
      tracks ? `Tracked objects: ${tracks}` : '',
      ocr ? `Visible text: ${ocr}` : '',
      gestures ? `Gestures: ${gestures}` : '',
      delta.sceneChange ? 'Scene changed' : '',
    ]
      .filter(Boolean)
      .join('; ')
  }

  buildLocalHints(context: HybridTurnContext): string | undefined {
    const deltaSummary = this.buildVisionDeltaSummary(this.options.getVisionDelta(), context.language)
    const topObject = context.localVision.objectCandidates[0]
    const topScene = context.localVision.sceneCandidates[0]

    const objectHint = topObject
      ? context.language === 'zh'
        ? `本地识别物体: ${topObject.label} (${Math.round(topObject.confidence * 100)}%)`
        : `Local object: ${topObject.label} (${Math.round(topObject.confidence * 100)}%)`
      : ''
    const sceneHint = topScene
      ? context.language === 'zh'
        ? `本地场景: ${topScene.label}`
        : `Local scene: ${topScene.label}`
      : ''

    const hints = [objectHint, sceneHint, deltaSummary].filter(Boolean).join('\n')
    return hints || undefined
  }

  async enrichTurn(context: HybridTurnContext): Promise<HybridTurnEnrichment> {
    const tier = this.resolveTier(context)

    if (tier === 'omni-direct') {
      return { tier }
    }

    if (tier === 'local-hints' || tier === 'local-only') {
      return {
        tier,
        hints: this.buildLocalHints(context),
      }
    }

    const result = await this.options.dialogueService.handleTurn({
      transcript: context.transcript,
      frame: this.options.getFrame(),
      language: context.language,
      networkState: context.networkState,
      memory: context.memory,
      mediaPrivacy: context.mediaPrivacy,
      conversationId: context.conversationId,
      longTermMemory: context.longTermMemory,
    })

    return {
      tier,
      visualAnswer: result.answer,
      hints:
        context.language === 'zh'
          ? `视觉验证结果: ${result.answer.answer}`
          : `Visual verification: ${result.answer.answer}`,
    }
  }
}

export function isHybridVisualTranscript(transcript: string): boolean {
  return isVisualQuestion(transcript.trim().toLocaleLowerCase())
}
