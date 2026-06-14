import type { ConversationTelemetryRecord } from '../types'
import { createConversationTelemetryRecord, estimateCostFromTokens, type ConversationTelemetryStore } from './conversationTelemetry'

export interface OmniSessionUsageInput {
  conversationId: string
  durationMs: number
  estimatedTokens?: number
  costPerThousandTokens?: number
}

export interface VlVerifyUsageInput {
  conversationId: string
  estimatedTokens: number
  actualTokens?: number
  costPerThousandTokens?: number
}

export function mergeOmniUsage(
  record: ConversationTelemetryRecord,
  durationMs: number,
  estimatedTokens = 0,
): ConversationTelemetryRecord {
  const existing = record as ConversationTelemetryRecord & {
    omniSessionDurationMs?: number
    omniEstimatedTokens?: number
    vlVerifyRequestCount?: number
  }

  return {
    ...record,
    estimatedTokens: record.estimatedTokens + estimatedTokens,
    omniSessionDurationMs: (existing.omniSessionDurationMs ?? 0) + durationMs,
    omniEstimatedTokens: (existing.omniEstimatedTokens ?? 0) + estimatedTokens,
  }
}

export function recordOmniSessionUsage(
  store: ConversationTelemetryStore,
  input: OmniSessionUsageInput,
): ConversationTelemetryRecord {
  const estimatedTokens = input.estimatedTokens ?? Math.max(1, Math.round(input.durationMs / 100))
  const estimatedCost = estimateCostFromTokens(estimatedTokens, input.costPerThousandTokens ?? 0.002)
  const existing = store.get(input.conversationId)
  const base =
    existing ??
    createConversationTelemetryRecord({
      conversationId: input.conversationId,
      estimatedTokens: 0,
      estimatedCost: 0,
    })

  return store.upsert(
    mergeOmniUsage(
      {
        ...base,
        estimatedCost: base.estimatedCost + estimatedCost,
        requestCount: base.requestCount + 1,
        updatedAt: Date.now(),
      },
      input.durationMs,
      estimatedTokens,
    ),
  )
}

export function recordVlVerifyUsage(
  store: ConversationTelemetryStore,
  input: VlVerifyUsageInput,
): ConversationTelemetryRecord {
  const estimatedCost = estimateCostFromTokens(input.estimatedTokens, input.costPerThousandTokens ?? 0.002)
  const existing = store.get(input.conversationId) as
    | (ConversationTelemetryRecord & { vlVerifyRequestCount?: number })
    | undefined

  const base =
    existing ??
    createConversationTelemetryRecord({
      conversationId: input.conversationId,
      estimatedTokens: 0,
      estimatedCost: 0,
    })

  return store.upsert({
    ...base,
    estimatedTokens: base.estimatedTokens + input.estimatedTokens,
    actualTokens: (base.actualTokens ?? 0) + (input.actualTokens ?? 0),
    estimatedCost: base.estimatedCost + estimatedCost,
    requestCount: base.requestCount + 1,
    vlVerifyRequestCount: (existing?.vlVerifyRequestCount ?? 0) + 1,
    updatedAt: Date.now(),
  } as ConversationTelemetryRecord & { vlVerifyRequestCount?: number })
}
