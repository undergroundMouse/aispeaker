import type { ConversationTelemetryRecord, OperationsBudgetConfig } from '@ai/shared'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export interface ConversationTelemetryStore {
  list: () => ConversationTelemetryRecord[]
  get: (conversationId: string) => ConversationTelemetryRecord | undefined
  upsert: (record: ConversationTelemetryRecord) => ConversationTelemetryRecord
  getDailySpend: (date: string) => number
  addDailySpend: (date: string, amount: number) => number
}

export function getBudgetDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
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

interface PersistedState {
  conversations: Record<string, ConversationTelemetryRecord>
  dailySpend: Record<string, number>
  budgetConfig: OperationsBudgetConfig
}

export class SqliteStore implements ConversationTelemetryStore {
  private state: PersistedState
  private readonly databasePath: string

  constructor(databasePath: string) {
    this.databasePath = databasePath
    mkdirSync(dirname(databasePath), { recursive: true })
    this.state = this.readState()
  }

  list(): ConversationTelemetryRecord[] {
    return Object.values(this.state.conversations).sort((left, right) => right.updatedAt - left.updatedAt)
  }

  get(conversationId: string): ConversationTelemetryRecord | undefined {
    return this.state.conversations[conversationId]
  }

  upsert(record: ConversationTelemetryRecord): ConversationTelemetryRecord {
    const existing = this.state.conversations[record.conversationId]
    const merged: ConversationTelemetryRecord = existing
      ? {
          ...existing,
          estimatedTokens: existing.estimatedTokens + record.estimatedTokens,
          actualTokens: (existing.actualTokens ?? 0) + (record.actualTokens ?? 0),
          estimatedCost: existing.estimatedCost + record.estimatedCost,
          requestCount: existing.requestCount + record.requestCount,
          updatedAt: record.updatedAt,
        }
      : record

    this.state.conversations[record.conversationId] = merged
    this.writeState()
    return merged
  }

  getDailySpend(date: string): number {
    return this.state.dailySpend[date] ?? 0
  }

  addDailySpend(date: string, amount: number): number {
    const next = this.getDailySpend(date) + amount
    this.state.dailySpend[date] = next
    this.writeState()
    return next
  }

  getBudgetConfig(): OperationsBudgetConfig {
    return this.state.budgetConfig
  }

  setBudgetConfig(dailyBudgetCap: number | null): OperationsBudgetConfig {
    this.state.budgetConfig = { dailyBudgetCap, updatedAt: Date.now() }
    this.writeState()
    return this.state.budgetConfig
  }

  close(): void {}

  private readState(): PersistedState {
    try {
      const raw = readFileSync(this.databasePath, 'utf8')
      return JSON.parse(raw) as PersistedState
    } catch {
      return {
        conversations: {},
        dailySpend: {},
        budgetConfig: { dailyBudgetCap: null, updatedAt: Date.now() },
      }
    }
  }

  private writeState(): void {
    writeFileSync(this.databasePath, JSON.stringify(this.state, null, 2), 'utf8')
  }
}
