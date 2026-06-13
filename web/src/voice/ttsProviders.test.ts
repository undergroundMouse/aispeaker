import { describe, expect, it } from 'vitest'
import { MockStreamingTtsProvider, selectTtsProvider, splitSpeakableSegments } from './ttsProviders'

describe('ttsProviders', () => {
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
