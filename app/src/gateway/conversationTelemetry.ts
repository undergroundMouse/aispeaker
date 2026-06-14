import type { ConversationTelemetryRecord } from '../types'

export interface ConversationTelemetryStore {
  list: () => ConversationTelemetryRecord[]
  get: (conversationId: string) => ConversationTelemetryRecord | undefined
  upsert: (record: ConversationTelemetryRecord) => ConversationTelemetryRecord
  resetDailySpend: (date: string) => void
  getDailySpend: (date: string) => number
  addDailySpend: (date: string, amount: number) => number
}

export class InMemoryConversationTelemetryStore implements ConversationTelemetryStore {
  private records = new Map<string, ConversationTelemetryRecord>()
  private dailySpend = new Map<string, number>()

  list(): ConversationTelemetryRecord[] {
    return [...this.records.values()].sort((left, right) => right.updatedAt - left.updatedAt)
  }

  get(conversationId: string): ConversationTelemetryRecord | undefined {
    return this.records.get(conversationId)
  }

  upsert(record: ConversationTelemetryRecord): ConversationTelemetryRecord {
    const existing = this.records.get(record.conversationId)
    const merged: ConversationTelemetryRecord = existing
      ? {
          ...existing,
          ...record,
          estimatedTokens: existing.estimatedTokens + record.estimatedTokens,
          actualTokens: (existing.actualTokens ?? 0) + (record.actualTokens ?? 0),
          estimatedCost: existing.estimatedCost + record.estimatedCost,
          requestCount: existing.requestCount + record.requestCount,
          updatedAt: record.updatedAt,
        }
      : record

    this.records.set(record.conversationId, merged)
    return merged
  }

  resetDailySpend(date: string): void {
    this.dailySpend.set(date, 0)
  }

  getDailySpend(date: string): number {
    return this.dailySpend.get(date) ?? 0
  }

  addDailySpend(date: string, amount: number): number {
    const next = this.getDailySpend(date) + amount
    this.dailySpend.set(date, next)
    return next
  }
}

export function createConversationTelemetryRecord(input: {
  conversationId: string
  estimatedTokens: number
  actualTokens?: number
  estimatedCost: number
  requestCount?: number
  now?: number
}): ConversationTelemetryRecord {
  const now = input.now ?? Date.now()
  return {
    conversationId: input.conversationId,
    estimatedTokens: input.estimatedTokens,
    actualTokens: input.actualTokens,
    estimatedCost: input.estimatedCost,
    requestCount: input.requestCount ?? 1,
    createdAt: now,
    updatedAt: now,
  }
}

export function estimateCostFromTokens(tokens: number, costPerThousandTokens = 0.002): number {
  return (tokens / 1000) * costPerThousandTokens
}

export function getBudgetDateKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}
