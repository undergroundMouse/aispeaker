import { describe, expect, it, vi } from 'vitest'
import { CloudGateway, MAX_CLOUD_RETRIES, NETWORK_FAILURE_MESSAGE } from './cloudGateway'
import { InMemoryConversationTelemetryStore } from './conversationTelemetry'

describe('cloudGateway', () => {
  it('retries retryable failures up to two times', async () => {
    const sleep = vi.fn(async () => undefined)
    const gateway = new CloudGateway({
      telemetryStore: new InMemoryConversationTelemetryStore(),
      sleep,
    })
    const invoke = vi
      .fn()
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValue('ok')

    const result = await gateway.invoke({
      context: { conversationId: 'conversation-1' },
      promptText: 'hello',
      invoke,
    })

    expect(result.ok).toBe(true)
    expect(invoke).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })

  it('returns network failure message after retries are exhausted', async () => {
    const gateway = new CloudGateway({
      telemetryStore: new InMemoryConversationTelemetryStore(),
      sleep: async () => undefined,
    })

    const result = await gateway.invoke({
      context: { conversationId: 'conversation-2' },
      promptText: 'hello',
      invoke: async () => {
        throw new Error('network timeout')
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe(NETWORK_FAILURE_MESSAGE)
    }
  })

  it('blocks requests that exceed the daily budget cap', async () => {
    const telemetryStore = new InMemoryConversationTelemetryStore()
    const gateway = new CloudGateway({
      telemetryStore,
      dailyBudgetCap: 0.001,
    })
    const invoke = vi.fn(async () => 'ok')

    const first = await gateway.invoke({
      context: { conversationId: 'conversation-3' },
      promptText: 'hello',
      invoke,
    })
    const second = await gateway.invoke({
      context: { conversationId: 'conversation-3' },
      promptText: 'a'.repeat(8000),
      invoke,
    })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)
    if (!second.ok) {
      expect(second.reason).toBe('budget-exceeded')
    }
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('does not exceed max retries on persistent failure', async () => {
    const invoke = vi.fn(async () => {
      throw new Error('network timeout')
    })
    const gateway = new CloudGateway({
      telemetryStore: new InMemoryConversationTelemetryStore(),
      sleep: async () => undefined,
    })

    await gateway.invoke({
      context: { conversationId: 'conversation-4' },
      promptText: 'hello',
      invoke,
    })

    expect(invoke).toHaveBeenCalledTimes(MAX_CLOUD_RETRIES + 1)
  })
})
