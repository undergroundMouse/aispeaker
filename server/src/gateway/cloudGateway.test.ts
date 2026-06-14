import { describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BUDGET_EXCEEDED_MESSAGE_ZH } from '@ai/shared'
import { CloudGateway } from './cloudGateway.js'
import { estimateRequestTokens } from './tokenEstimator.js'
import {
  createConversationTelemetryRecord,
  SqliteStore,
} from '../db/store.js'

function createTestStore(): SqliteStore {
  const dir = mkdtempSync(join(tmpdir(), 'cp-test-'))
  return new SqliteStore(join(dir, 'state.json'))
}

describe('tokenEstimator', () => {
  it('estimates image tokens using 1024px edge rule', () => {
    expect(estimateRequestTokens({ text: 'hello', frameWidth: 2048, frameHeight: 1080 })).toBeGreaterThan(85)
  })
})

describe('CloudGateway', () => {
  it('blocks requests when budget would be exceeded', async () => {
    const store = createTestStore()
    store.setBudgetConfig(0.0001)
    const gateway = new CloudGateway({
      telemetryStore: store,
      getDailyBudgetCap: () => store.getBudgetConfig().dailyBudgetCap,
      costPerThousandTokens: 0.002,
    })

    const result = await gateway.invoke({
      conversationId: 'c1',
      promptText: 'x'.repeat(4000),
      frameWidth: 2048,
      frameHeight: 2048,
      invoke: async () => ({ value: { ok: true } }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('budget-exceeded')
      expect(result.message).toBe(BUDGET_EXCEEDED_MESSAGE_ZH)
    }

    store.close()
  })

  it('persists telemetry after successful invoke', async () => {
    const store = createTestStore()
    const gateway = new CloudGateway({
      telemetryStore: store,
      getDailyBudgetCap: () => null,
    })

    const result = await gateway.invoke({
      conversationId: 'c2',
      promptText: 'test',
      invoke: async () => ({ value: { ok: true }, actualTokens: 120 }),
    })

    expect(result.ok).toBe(true)
    expect(store.get('c2')?.actualTokens).toBe(120)
    store.close()
  })
})

describe('SqliteStore', () => {
  it('merges conversation telemetry records', () => {
    const store = createTestStore()
    store.upsert(
      createConversationTelemetryRecord({
        conversationId: 'c3',
        estimatedTokens: 10,
        estimatedCost: 0.01,
      }),
    )
    store.upsert(
      createConversationTelemetryRecord({
        conversationId: 'c3',
        estimatedTokens: 5,
        actualTokens: 4,
        estimatedCost: 0.02,
      }),
    )

    const record = store.get('c3')
    expect(record?.estimatedTokens).toBe(15)
    expect(record?.actualTokens).toBe(4)
    store.close()
  })
})
