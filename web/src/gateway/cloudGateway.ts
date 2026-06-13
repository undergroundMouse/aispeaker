import type {
  CloudGatewayRequestContext,
  CloudGatewayResult,
  CloudVisualLanguageProvider,
  CloudVisualQuestionRequest,
  VisualAnswer,
} from '../types'
import { getNetworkRetryMessage } from '../voice/localCommands'
import {
  createConversationTelemetryRecord,
  estimateCostFromTokens,
  getBudgetDateKey,
  type ConversationTelemetryStore,
} from './conversationTelemetry'
import { estimateRequestTokens } from './tokenEstimator'

export const MAX_CLOUD_RETRIES = 2
export const NETWORK_FAILURE_MESSAGE = '网络不佳，请重试'

export type CloudGatewayFailureReason = 'network' | 'budget-exceeded' | 'provider-error'

export interface CloudGatewayOptions {
  telemetryStore: ConversationTelemetryStore
  dailyBudgetCap?: number
  costPerThousandTokens?: number
  sleep?: (ms: number) => Promise<void>
}

export interface CloudGatewayInvokeInput<T> {
  context: CloudGatewayRequestContext
  promptText: string
  frame?: CloudVisualQuestionRequest['frame']
  invoke: () => Promise<T>
  extractActualTokens?: (result: T) => number | undefined
}

export class CloudGateway {
  private readonly telemetryStore: ConversationTelemetryStore
  private dailyBudgetCap: number | null
  private readonly costPerThousandTokens: number
  private readonly sleep: (ms: number) => Promise<void>

  constructor({
    telemetryStore,
    dailyBudgetCap,
    costPerThousandTokens = 0.002,
    sleep = defaultSleep,
  }: CloudGatewayOptions) {
    this.telemetryStore = telemetryStore
    this.dailyBudgetCap = dailyBudgetCap ?? null
    this.costPerThousandTokens = costPerThousandTokens
    this.sleep = sleep
  }

  setDailyBudgetCap(cap: number | null): void {
    this.dailyBudgetCap = cap
  }

  getTelemetryStore(): ConversationTelemetryStore {
    return this.telemetryStore
  }

  async invoke<T>(input: CloudGatewayInvokeInput<T>): Promise<CloudGatewayResult<T>> {
    const estimatedTokens = estimateRequestTokens({
      text: input.promptText,
      frame: input.frame,
    })
    const estimatedCost = estimateCostFromTokens(estimatedTokens, this.costPerThousandTokens)
    const budgetDate = getBudgetDateKey()

    if (this.dailyBudgetCap !== null) {
      const projected = this.telemetryStore.getDailySpend(budgetDate) + estimatedCost
      if (projected > this.dailyBudgetCap) {
        return {
          ok: false,
          reason: 'budget-exceeded',
          message: NETWORK_FAILURE_MESSAGE,
          estimatedTokens,
          estimatedCost,
        }
      }
    }

    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_CLOUD_RETRIES; attempt += 1) {
      if (attempt > 0) {
        await this.sleep(backoffMs(attempt))
      }

      try {
        const value = await input.invoke()
        const actualTokens = input.extractActualTokens?.(value)
        const finalCost = estimateCostFromTokens(actualTokens ?? estimatedTokens, this.costPerThousandTokens)

        this.telemetryStore.upsert(
          createConversationTelemetryRecord({
            conversationId: input.context.conversationId,
            estimatedTokens,
            actualTokens,
            estimatedCost: finalCost,
          }),
        )
        this.telemetryStore.addDailySpend(budgetDate, finalCost)

        return {
          ok: true,
          value,
          estimatedTokens,
          actualTokens,
          estimatedCost: finalCost,
        }
      } catch (error) {
        lastError = error
        if (!isRetryableError(error) || attempt === MAX_CLOUD_RETRIES) {
          break
        }
      }
    }

    return {
      ok: false,
      reason: isRetryableError(lastError) ? 'network' : 'provider-error',
      message: NETWORK_FAILURE_MESSAGE,
      estimatedTokens,
      estimatedCost,
      error: lastError,
    }
  }
}

export class GatewayCloudVisualLanguageProvider implements CloudVisualLanguageProvider {
  private readonly inner: CloudVisualLanguageProvider
  private readonly gateway: CloudGateway
  private readonly getContext: () => CloudGatewayRequestContext

  constructor(
    inner: CloudVisualLanguageProvider,
    gateway: CloudGateway,
    getContext: () => CloudGatewayRequestContext,
  ) {
    this.inner = inner
    this.gateway = gateway
    this.getContext = getContext
  }

  async answerVisualQuestion(request: CloudVisualQuestionRequest): Promise<VisualAnswer> {
    const promptText = [
      request.transcript,
      request.longTermMemoryContext?.promptText ?? '',
      JSON.stringify(request.localVision.objectCandidates.slice(0, 3)),
    ].join('\n')

    const result = await this.gateway.invoke({
      context: this.getContext(),
      promptText,
      frame: request.frame,
      invoke: () => this.inner.answerVisualQuestion(request),
    })

    if (!result.ok) {
      return {
        kind: 'network-error',
        answer: getNetworkRetryMessage(request.language),
        source: 'system',
        referencedEntities: [],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      }
    }

    return result.value
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return true
    }
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status: number }).status)
    return status >= 500
  }

  return false
}

function backoffMs(attempt: number): number {
  return 200 * 2 ** (attempt - 1)
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
