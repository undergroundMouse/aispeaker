import { describe, expect, it } from 'vitest'
import { decodeServerOmniMessage, encodeClientOmniMessage } from './omniRealtimeProtocol'

describe('omniRealtimeProtocol', () => {
  it('round-trips bootstrap message', () => {
    const encoded = encodeClientOmniMessage({
      type: 'session.bootstrap',
      payload: {
        conversationId: 'conv-1',
        language: 'zh',
      },
    })

    expect(encoded).toContain('session.bootstrap')
  })

  it('decodes session ready message', () => {
    const message = decodeServerOmniMessage(
      JSON.stringify({
        type: 'session.ready',
        payload: { sessionId: 's1', model: 'qwen3.5-omni-plus-realtime' },
      }),
    )

    expect(message?.type).toBe('session.ready')
    if (message?.type === 'session.ready') {
      expect(message.payload.sessionId).toBe('s1')
    }
  })

  it('decodes relayed omni events', () => {
    const message = decodeServerOmniMessage(
      JSON.stringify({
        type: 'omni.event',
        event: { type: 'response.audio.delta', delta: 'abc' },
      }),
    )

    expect(message?.type).toBe('omni.event')
  })
})
