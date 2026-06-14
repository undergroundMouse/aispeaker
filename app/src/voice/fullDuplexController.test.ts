import { describe, expect, it } from 'vitest'
import { FullDuplexController } from './fullDuplexController'

describe('FullDuplexController', () => {
  it('transitions to barge-in when user speaks during TTS', () => {
    let bargeIn = false
    const controller = new FullDuplexController({
      bargeInThreshold: 0.04,
      onBargeIn: () => {
        bargeIn = true
      },
    })

    controller.startSpeaking()
    controller.handleUserSpeechDuringTts(0.08)
    expect(controller.getState()).toBe('barge-in')
    expect(bargeIn).toBe(true)
  })
})
