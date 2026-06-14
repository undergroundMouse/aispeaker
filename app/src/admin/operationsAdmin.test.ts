import { describe, expect, it } from 'vitest'
import { InMemoryOperationsAdmin, OperationsAuthorizationError } from './operationsAdmin'
import { InMemoryConversationTelemetryStore, createConversationTelemetryRecord } from '../gateway/conversationTelemetry'

describe('operationsAdmin', () => {
  it('requires admin authorization', () => {
    const admin = new InMemoryOperationsAdmin(new InMemoryConversationTelemetryStore())
    expect(() => admin.listConversations('invalid')).toThrow(OperationsAuthorizationError)
  })

  it('lists conversation telemetry for authorized operators', () => {
    const telemetryStore = new InMemoryConversationTelemetryStore()
    telemetryStore.upsert(
      createConversationTelemetryRecord({
        conversationId: 'conversation-1',
        estimatedTokens: 120,
        estimatedCost: 0.00024,
      }),
    )
    const admin = new InMemoryOperationsAdmin(telemetryStore)

    const records = admin.listConversations('ops-admin-token')
    expect(records).toHaveLength(1)
    expect(records[0]?.conversationId).toBe('conversation-1')
  })

  it('enforces and resets daily budget configuration', () => {
    const admin = new InMemoryOperationsAdmin(new InMemoryConversationTelemetryStore())
    const config = admin.setDailyBudgetCap('ops-admin-token', 1.5)
    expect(config.dailyBudgetCap).toBe(1.5)
    expect(admin.getBudgetConfig('ops-admin-token').dailyBudgetCap).toBe(1.5)
  })
})
