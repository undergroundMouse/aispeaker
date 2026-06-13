import { describe, expect, it } from 'vitest'
import {
  canRouteComplexRequest,
  getNetworkRetryMessage,
  matchLocalCommand,
  normalizePhrase,
} from './localCommands'

describe('localCommands', () => {
  it('normalizes punctuation, casing, and whitespace', () => {
    expect(normalizePhrase('  Stop Dialogue! ')).toBe('stop dialogue')
    expect(normalizePhrase('你好！')).toBe('你好')
  })

  it('matches configured Chinese and English command phrases locally', () => {
    expect(matchLocalCommand('停止')?.command.action).toBe('stop-dialogue')
    expect(matchLocalCommand('take photo')?.command.action).toBe('take-photo')
    expect(matchLocalCommand('switch to English')?.command.targetLanguage).toBe('en')
    expect(matchLocalCommand('切换到中文')?.command.targetLanguage).toBe('zh')
    expect(matchLocalCommand('忘记那个物体')?.command.action).toBe('forget-custom-object')
    expect(matchLocalCommand('undo last teaching')?.command.action).toBe('undo-custom-object-teaching')
    expect(matchLocalCommand('闭嘴，别主动说话')?.command.action).toBe('disable-proactive-prompts')
    expect(matchLocalCommand('多提醒我')?.command.action).toBe('increase-proactive-prompts')
    expect(matchLocalCommand('错了')?.command.action).toBe('proactive-prompt-wrong')
  })

  it('does not match unconfigured phrases', () => {
    expect(matchLocalCommand('what is the weather today')).toBeNull()
  })

  it('routes complex requests only when network is online', () => {
    expect(canRouteComplexRequest('online')).toBe(true)
    expect(canRouteComplexRequest('weak')).toBe(false)
    expect(canRouteComplexRequest('offline')).toBe(false)
  })

  it('returns language-aware weak-network retry messages', () => {
    expect(getNetworkRetryMessage('zh')).toBe('网络不佳，请重试')
    expect(getNetworkRetryMessage('en')).toBe('Network is poor. Please try again.')
  })
})
