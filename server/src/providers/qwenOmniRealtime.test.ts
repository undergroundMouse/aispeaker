import { describe, expect, it } from 'vitest'
import {
  buildDefaultOmniSessionUpdate,
  buildOmniUpstreamUrl,
  createOmniEventId,
} from './qwenOmniRealtime.js'

describe('qwenOmniRealtime', () => {
  it('builds upstream url with model query param', () => {
    expect(buildOmniUpstreamUrl('wss://dashscope.aliyuncs.com/api-ws/v1/realtime', 'qwen3.5-omni-plus-realtime')).toBe(
      'wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime',
    )
  })

  it('builds default session update with audio modalities and VAD', () => {
    const session = buildDefaultOmniSessionUpdate({
      language: 'zh',
      voice: 'Cherry',
      turnDetection: 'semantic_vad',
    })

    expect(session.modalities).toEqual(['text', 'audio'])
    expect(session.input_audio_format).toBe('pcm')
    expect(session.output_audio_format).toBe('pcm')
    expect(session.turn_detection).toMatchObject({ type: 'semantic_vad' })
  })

  it('creates unique omni event ids', () => {
    expect(createOmniEventId()).not.toBe(createOmniEventId())
  })
})
