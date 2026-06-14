import { describe, expect, it } from 'vitest'
import { buildQwenVisualPrompt } from './qwenProvider.js'

describe('qwenProvider memory candidates', () => {
  it('includes memory candidate schema in visual prompt', () => {
    const prompt = buildQwenVisualPrompt({
      transcript: '我喜欢把咖啡杯放在桌上',
      language: 'zh',
      localVisionHints: {
        objectCandidates: [],
        sceneCandidates: [],
        gestures: [],
      },
    })

    expect(prompt).toContain('memoryCandidates')
    expect(prompt).toContain('preference|object-location|habit|fact')
  })
})
