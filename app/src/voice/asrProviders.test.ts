import { describe, expect, it, vi } from 'vitest'
import type { AppLanguage, AsrEvent, AsrProvider, AsrProviderCapabilities, AsrRequest } from '../types'
import { MockAsrProvider, WebSpeechAsrProvider, selectAsrProvider } from './asrProviders'

class AvailableAsrProvider implements AsrProvider {
  readonly kind: AsrProvider['kind']

  constructor(kind: AsrProvider['kind']) {
    this.kind = kind
  }

  getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
    return {
      kind: this.kind,
      available: true,
      local: this.kind === 'web-speech' || this.kind === 'mock',
      supportsInterimResults: true,
      supportsLanguage: true,
    }
  }

  startSession(_request: AsrRequest, _onEvent: (event: AsrEvent) => void): void {}

  stopSession(): Promise<string> {
    return Promise.resolve('')
  }

  cancel(): void {}
}

describe('asrProviders', () => {
  it('selects mock provider when preferMock is true', () => {
    const providers = [new WebSpeechAsrProvider(), new MockAsrProvider('hello')]
    const selection = selectAsrProvider({ providers, language: 'en', preferMock: true })

    expect(selection.provider?.kind).toBe('mock')
  })

  it('prefers browser speech recognition before cloud streaming by default', () => {
    const providers = [
      new AvailableAsrProvider('cloud-streaming'),
      new AvailableAsrProvider('web-speech'),
    ]
    const selection = selectAsrProvider({ providers, language: 'zh' })

    expect(selection.provider?.kind).toBe('web-speech')
  })

  it('streams interim and final results from MockAsrProvider', async () => {
    const provider = new MockAsrProvider('你好')
    const events: string[] = []

    provider.startSession({ turnId: 'turn-1', language: 'zh' }, (event) => {
      if (event.type === 'interim' || event.type === 'final') {
        events.push(`${event.type}:${event.text}`)
      }
    })

    expect(events).toContain('interim:你好')

    const transcript = await provider.stopSession()
    expect(transcript).toBe('你好')
    expect(events).toContain('final:你好')
  })

  it('reports unavailable when browser speech recognition is missing', () => {
    const provider = new WebSpeechAsrProvider()
    const capabilities = provider.getCapabilities('en')

    expect(capabilities.available).toBe(false)
  })

  it('emits error when WebSpeechAsrProvider starts without browser support', () => {
    const provider = new WebSpeechAsrProvider()
    const onEvent = vi.fn()

    provider.startSession({ turnId: 'turn-1', language: 'en' }, onEvent)

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Speech recognition is unavailable.',
      }),
    )
  })
})
