import { describe, expect, it, vi } from 'vitest'
import type { TtsEvent } from '../types'
import { MockStreamingTtsProvider, WebSpeechTtsProvider, selectTtsProvider, splitSpeakableSegments } from './ttsProviders'

describe('ttsProviders', () => {
  it('keeps Web Speech playback active until synthesis ends', async () => {
    class MockSpeechSynthesisUtterance extends EventTarget {
      readonly text: string
      lang = ''
      rate = 1
      pitch = 1
      volume = 1
      voice: SpeechSynthesisVoice | null = null
      onstart: ((event: SpeechSynthesisEvent) => void) | null = null
      onend: ((event: SpeechSynthesisEvent) => void) | null = null
      onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null

      constructor(text: string) {
        super()
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
    let activeUtterance: MockSpeechSynthesisUtterance | null = null
    const synthesis = {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (utterance: SpeechSynthesisUtterance) => {
        activeUtterance = utterance as MockSpeechSynthesisUtterance
        utterance.onstart?.(new Event('start') as SpeechSynthesisEvent)
      },
    }
    const provider = new WebSpeechTtsProvider(synthesis)
    const iterator = provider
      .speak({ turnId: 'turn-1', text: '你好。', language: 'zh' })
      [Symbol.asyncIterator]() as AsyncIterator<TtsEvent>

    expect((await iterator.next()).value).toMatchObject({ type: 'start' })
    expect((await iterator.next()).value).toMatchObject({ type: 'first-audio' })

    const pendingEnd = iterator.next()
    await Promise.resolve()
    let settled = false
    pendingEnd.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    const utterance = activeUtterance as MockSpeechSynthesisUtterance | null
    expect(utterance).not.toBeNull()
    utterance!.onend?.(new Event('end') as SpeechSynthesisEvent)
    expect((await pendingEnd).value).toMatchObject({ type: 'end' })
  })

  it('splits answer text into speakable sentence segments', () => {
    expect(splitSpeakableSegments('你好。请看这里！Done.')).toEqual(['你好。', '请看这里！', 'Done.'])
  })

  it('selects cloud streaming TTS when preferred and online', () => {
    const cloud = new MockStreamingTtsProvider({
      kind: 'cloud-streaming',
      local: false,
      supportsStreaming: true,
    })
    const local = new MockStreamingTtsProvider({ kind: 'web-speech', local: true })

    const selection = selectTtsProvider({
      providers: [cloud, local],
      language: 'zh',
      networkState: 'online',
      preferCloud: true,
    })

    expect(selection.provider?.kind).toBe('cloud-streaming')
    expect(selection.fallbackUsed).toBe(false)
  })

  it('falls back to local TTS when cloud is preferred during weak network', () => {
    const cloud = new MockStreamingTtsProvider({
      kind: 'cloud-streaming',
      local: false,
      supportsStreaming: true,
    })
    const local = new MockStreamingTtsProvider({ kind: 'web-speech', local: true })

    const selection = selectTtsProvider({
      providers: [cloud, local],
      language: 'en',
      networkState: 'weak',
      preferCloud: true,
    })

    expect(selection.provider?.kind).toBe('web-speech')
    expect(selection.fallbackUsed).toBe(true)
  })
})
