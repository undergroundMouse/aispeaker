import type { CloudVisualAnswerRequest, CloudVisualAnswerResponse } from '@ai/shared'
import type { ServerConfig } from '../config.js'
import type { SqliteStore } from '../db/store.js'
import { CloudGateway } from '../gateway/cloudGateway.js'
import { QwenVisualLanguageProvider } from '../providers/qwenProvider.js'

export class VisualAnswerService {
  private readonly gateway: CloudGateway
  private readonly qwenProvider: QwenVisualLanguageProvider | null

  constructor(
    private readonly store: SqliteStore,
    config: ServerConfig,
    qwenProvider?: QwenVisualLanguageProvider | null,
  ) {
    this.gateway = new CloudGateway({
      telemetryStore: store,
      getDailyBudgetCap: () => store.getBudgetConfig().dailyBudgetCap,
      costPerThousandTokens: config.costPerThousandTokens,
    })
    this.qwenProvider =
      qwenProvider ??
      (config.qwenApiKey
        ? new QwenVisualLanguageProvider({
            apiKey: config.qwenApiKey,
            baseUrl: config.qwenBaseUrl,
            model: config.qwenModel,
          })
        : null)
  }

  async handle(request: CloudVisualAnswerRequest): Promise<CloudVisualAnswerResponse> {
    if (request.frame && !request.consent.cloudMediaTransmission) {
      return {
        ok: false,
        reason: 'provider-error',
        message: 'Cloud media transmission is not authorized.',
        telemetry: { estimatedTokens: 0, estimatedCost: 0 },
      }
    }

    if (!this.qwenProvider) {
      return {
        ok: false,
        reason: 'provider-error',
        message: 'Qwen provider is not configured on the server.',
        telemetry: { estimatedTokens: 0, estimatedCost: 0 },
      }
    }

    const promptText = [
      request.transcript,
      request.longTermMemoryContext ?? '',
      JSON.stringify(request.localVisionHints.objectCandidates.slice(0, 3)),
    ].join('\n')

    const memoryContext = request.consent.cloudMemoryAccess ? request.longTermMemoryContext : null

    const result = await this.gateway.invoke({
      conversationId: request.conversationId,
      promptText,
      frameWidth: request.frame?.width,
      frameHeight: request.frame?.height,
      invoke: async () => {
        const outcome = await this.qwenProvider!.answerVisualQuestion({
          transcript: request.transcript,
          language: request.language,
          frame: request.consent.cloudMediaTransmission ? request.frame : null,
          localVisionHints: request.localVisionHints,
          longTermMemoryContext: memoryContext,
        })
        return { value: outcome.answer, actualTokens: outcome.actualTokens }
      },
    })

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        message: result.message,
        telemetry: result.telemetry,
      }
    }

    return {
      ok: true,
      answer: result.value,
      telemetry: result.telemetry,
    }
  }
}
