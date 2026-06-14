import { describe, expect, it } from 'vitest'
import { encodeClientMessage, decodeServerMessage } from './sessionProtocol'

describe('sessionProtocol', () => {
  it('round-trips client messages', () => {
    const encoded = encodeClientMessage({
      type: 'session.start',
      payload: {
        conversationId: 'conv-1',
        language: 'zh',
        capabilities: ['full-duplex'],
        privacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: false },
      },
    })
    expect(encoded).toContain('session.start')
  })

  it('decodes server ready message', () => {
    const message = decodeServerMessage(
      JSON.stringify({
        type: 'session.ready',
        payload: { sessionId: 's1', resumeToken: 'r1' },
      }),
    )
    expect(message?.type).toBe('session.ready')
  })
})
