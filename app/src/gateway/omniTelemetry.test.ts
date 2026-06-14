import { describe, expect, it } from 'vitest'
import { InMemoryConversationTelemetryStore } from './conversationTelemetry'
import { recordOmniSessionUsage, recordVlVerifyUsage } from './omniTelemetry'

describe('omniTelemetry', () => {
  it('records omni session duration and tokens', () => {
    const store = new InMemoryConversationTelemetryStore()
    const record = recordOmniSessionUsage(store, {
      conversationId: 'conv-1',
      durationMs: 12_000,
      estimatedTokens: 120,
    })

    expect(record.omniSessionDurationMs).toBe(12_000)
    expect(record.omniEstimatedTokens).toBe(120)
  })

  it('records vl verify usage separately', () => {
    const store = new InMemoryConversationTelemetryStore()
    const record = recordVlVerifyUsage(store, {
      conversationId: 'conv-1',
      estimatedTokens: 256,
      actualTokens: 240,
    }) as { vlVerifyRequestCount?: number }

    expect(record.vlVerifyRequestCount).toBe(1)
    expect(record.estimatedTokens).toBe(256)
  })
})
