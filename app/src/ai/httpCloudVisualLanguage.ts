import type { CloudVisualAnswerResponse } from '@ai/shared'
import type { CloudVisualLanguageProvider, CloudVisualQuestionRequest, VisualAnswer } from '../types'
import {
  resolveCloudFailureMessage,
  resolveFetchFailureMessage,
} from '../voice/cloudFailureMessages'
import { postCloudVisualAnswer, type BackendClientConfig } from './backendClient'

async function frameToDataUrl(frame: NonNullable<CloudVisualQuestionRequest['frame']>): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read frame blob.'))
    reader.readAsDataURL(frame.blob)
  })
}

function createNetworkErrorAnswer(answer: string): VisualAnswer {
  return {
    kind: 'network-error',
    answer,
    source: 'system',
    referencedEntities: [],
    regions: [],
    evidenceAvailable: false,
    requiresSpeech: true,
  }
}

export class HttpCloudVisualLanguageProvider implements CloudVisualLanguageProvider {
  private readonly config: BackendClientConfig
  private readonly fetchImpl: typeof fetch
  private readonly getContext: () => {
    conversationId: string
    consent: { cloudMediaTransmission: boolean; cloudMemoryAccess: boolean }
  }
  private lastTelemetry:
    | { estimatedTokens: number; actualTokens?: number; estimatedCost: number }
    | undefined

  constructor(
    config: BackendClientConfig,
    getContext: () => {
      conversationId: string
      consent: { cloudMediaTransmission: boolean; cloudMemoryAccess: boolean }
    },
    fetchImpl: typeof fetch = fetch,
  ) {
    this.config = config
    this.getContext = getContext
    this.fetchImpl = fetchImpl
  }

  getLastTelemetry():
    | { estimatedTokens: number; actualTokens?: number; estimatedCost: number }
    | undefined {
    return this.lastTelemetry
  }

  async answerVisualQuestion(request: CloudVisualQuestionRequest): Promise<VisualAnswer> {
    const { conversationId, consent } = this.getContext()
    const frame = request.frame
      ? {
          dataUrl: await frameToDataUrl(request.frame),
          width: request.frame.width,
          height: request.frame.height,
          capturedAt: request.frame.capturedAt,
        }
      : null

    let response: CloudVisualAnswerResponse
    try {
      response = await postCloudVisualAnswer(
        this.config,
        {
          conversationId,
          transcript: request.transcript,
          language: request.language,
          consent,
          frame,
          localVisionHints: {
            objectCandidates: request.localVision.objectCandidates,
            sceneCandidates: request.localVision.sceneCandidates,
            gestures: request.localVision.gestures,
          },
          longTermMemoryContext: request.longTermMemoryContext?.promptText ?? null,
        },
        this.fetchImpl,
      )
    } catch (error) {
      return createNetworkErrorAnswer(resolveFetchFailureMessage(request.language, error))
    }

    this.lastTelemetry = response.telemetry

    if (!response.ok) {
      return createNetworkErrorAnswer(
        resolveCloudFailureMessage(request.language, response.reason, response.message),
      )
    }

    return response.answer
  }
}
