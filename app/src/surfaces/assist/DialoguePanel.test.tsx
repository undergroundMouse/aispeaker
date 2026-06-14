// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DialoguePanel } from './DialoguePanel'
import type { AsrCaptureState } from '../../types'

const idleAsr: AsrCaptureState = {
  status: 'idle',
  provider: null,
  currentTurnId: null,
  interimText: '',
  finalText: '',
  errorMessage: null,
}

const panelProps = {
  chatInputText: '',
  microphoneReady: true,
  onChatInputChange: () => undefined,
  onChatInputSubmit: () => undefined,
  onStartPushToTalk: () => undefined,
  onStopPushToTalk: () => undefined,
  onOpenPrivacySettings: () => undefined,
}

describe('DialoguePanel', () => {
  afterEach(() => cleanup())

  it('renders interim user transcript with listening styling', () => {
    render(
      <DialoguePanel
        language="zh"
        asrState={{
          ...idleAsr,
          status: 'listening',
          provider: 'mock',
          currentTurnId: 'turn-1',
          interimText: '你好',
        }}
        isPushToTalkActive
        speechStatus="idle"
        captionTurns={[]}
        proactiveBanner={{ visible: false, text: '', promptId: null }}
        {...panelProps}
      />,
    )

    expect(screen.getByText('你好')).toBeTruthy()
    expect(document.querySelector('.chat-message--user .chat-message__bubble--interim')).toBeTruthy()
    expect(screen.getByText('你')).toBeTruthy()
  })

  it('renders assistant streaming turn in dialogue column', () => {
    render(
      <DialoguePanel
        language="zh"
        asrState={idleAsr}
        isPushToTalkActive={false}
        speechStatus="speaking"
        captionTurns={[
          {
            id: 'turn-1',
            role: 'assistant',
            userText: '告诉我房间里有什么',
            assistantText: '正在分析语音和画面',
            assistantFinal: false,
          },
        ]}
        proactiveBanner={{ visible: false, text: '', promptId: null }}
        {...panelProps}
      />,
    )

    expect(screen.getByText(/正在分析语音和画面/)).toBeTruthy()
    expect(screen.getByText('告诉我房间里有什么')).toBeTruthy()
    expect(document.querySelector('.chat-message--assistant.chat-message--streaming')).toBeTruthy()
  })

  it('always shows a text composer for user input', () => {
    render(
      <DialoguePanel
        language="zh"
        asrState={idleAsr}
        isPushToTalkActive={false}
        speechStatus="idle"
        captionTurns={[]}
        proactiveBanner={{ visible: false, text: '', promptId: null }}
        {...panelProps}
        chatInputText="你好"
      />,
    )

    expect(screen.getByLabelText('输入消息')).toBeTruthy()
    expect(screen.getByDisplayValue('你好')).toBeTruthy()
    expect(screen.getByText('发送')).toBeTruthy()
  })

  it('shows ASR unavailable notice above the composer', () => {
    render(
      <DialoguePanel
        language="en"
        asrState={{
          ...idleAsr,
          status: 'unavailable',
          errorMessage: 'Speech recognition is unavailable.',
        }}
        isPushToTalkActive={false}
        speechStatus="idle"
        captionTurns={[]}
        proactiveBanner={{ visible: false, text: '', promptId: null }}
        {...panelProps}
      />,
    )

    expect(screen.getByText(/Speech recognition is unavailable/)).toBeTruthy()
    expect(screen.getByLabelText('Message')).toBeTruthy()
  })
})
