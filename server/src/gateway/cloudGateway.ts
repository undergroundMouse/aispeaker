import {
  BUDGET_EXCEEDED_MESSAGE_ZH,
  NETWORK_FAILURE_MESSAGE_ZH,
  type CloudGatewayFailureReason,
  type CloudRequestTelemetry,
} from '@ai/shared'
import {
  createConversationTelemetryRecord,
  estimateCostFromTokens,
  getBudgetDateKey,
  type ConversationTelemetryStore,
} from '../db/store.js'
import { estimateRequestTokens } from './tokenEstimator.js'

export const MAX_CLOUD_RETRIES = 2

export interface CloudGatewaySuccessResult<T> {
  ok: true
  value: T
  telemetry: CloudRequestTelemetry
}

export interface CloudGatewayFailureResult {
  ok: false
  reason: CloudGatewayFailureReason
  message: string
  telemetry: CloudRequestTelemetry
  error?: unknown
}

export type CloudGatewayResult<T> = CloudGatewaySuccessResult<T> | CloudGatewayFailureResult

export interface CloudGatewayOptions {
  telemetryStore: ConversationTelemetryStore
  getDailyBudgetCap: () => number | null
  costPerThousandTokens?: number
  sleep?: (ms: number) => Promise<void>
}

export interface CloudGatewayInvokeInput<T> {
  conversationId: string
  promptText: string
  frameWidth?: number
  frameHeight?: number
  invoke: () => Promise<{ value: T; actualTokens?: number }>
}

export class CloudGateway {
  private readonly telemetryStore: ConversationTelemetryStore
  private readonly getDailyBudgetCap: () => number | null
  private readonly costPerThousandTokens: number
  private readonly sleep: (ms: number) => Promise<void>

  constructor({
    telemetryStore,
    getDailyBudgetCap,
    costPerThousandTokens = 0.002,
    sleep = defaultSleep,
  }: CloudGatewayOptions) {
    this.telemetryStore = telemetryStore
    this.getDailyBudgetCap = getDailyBudgetCap
    this.costPerThousandTokens = costPerThousandTokens
    this.sleep = sleep
  }

  async invoke<T>(input: CloudGatewayInvokeInput<T>): Promise<CloudGatewayResult<T>> {
    const estimatedTokens = estimateRequestTokens({
      text: input.promptText,
      frameWidth: input.frameWidth,
      frameHeight: input.frameHeight,
    })
    const estimatedCost = estimateCostFromTokens(estimatedTokens, this.costPerThousandTokens)
    const budgetDate = getBudgetDateKey()
    const telemetryBase = { estimatedTokens, estimatedCost }

    const dailyBudgetCap = this.getDailyBudgetCap()
    if (dailyBudgetCap !== null) {
      const projected = this.telemetryStore.getDailySpend(budgetDate) + estimatedCost
      if (projected > dailyBudgetCap) {
        return {
          ok: false,
          reason: 'budget-exceeded',
          message: BUDGET_EXCEEDED_MESSAGE_ZH,
          telemetry: telemetryBase,
        }
      }
    }

    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_CLOUD_RETRIES; attempt += 1) {
      if (attempt > 0) {
        await this.sleep(backoffMs(attempt))
      }

      try {
        const outcome = await input.invoke()
        const finalCost = estimateCostFromTokens(
          outcome.actualTokens ?? estimatedTokens,
          this.costPerThousandTokens,
        )

        this.telemetryStore.upsert(
          createConversationTelemetryRecord({
            conversationId: input.conversationId,
            estimatedTokens,
            actualTokens: outcome.actualTokens,
            estimatedCost: finalCost,
          }),
        )
        this.telemetryStore.addDailySpend(budgetDate, finalCost)

        return {
          ok: true,
          value: outcome.value,
          telemetry: {
            estimatedTokens,
            actualTokens: outcome.actualTokens,
            estimatedCost: finalCost,
          },
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
      message: resolveCloudGatewayFailureMessage(lastError),
      telemetry: telemetryBase,
      error: lastError,
    }
  }
}

function resolveCloudGatewayFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return NETWORK_FAILURE_MESSAGE_ZH
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
