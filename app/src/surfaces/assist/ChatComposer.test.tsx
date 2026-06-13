// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatComposer } from './ChatComposer'

const composerProps = {
  isPushToTalkActive: false,
  microphoneReady: true,
  onStartPushToTalk: () => undefined,
  onStopPushToTalk: () => undefined,
}

describe('ChatComposer', () => {
  afterEach(() => cleanup())

  it('submits trimmed text from the send button', () => {
    const onSubmit = vi.fn()
    render(
      <ChatComposer
        language="zh"
        value="你好"
        onChange={() => undefined}
        onSubmit={onSubmit}
        {...composerProps}
      />,
    )

    fireEvent.click(screen.getByText('发送'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submits on Enter and ignores empty input', () => {
    const onSubmit = vi.fn()
    render(<ChatComposer language="zh" value="" onChange={() => undefined} onSubmit={onSubmit} {...composerProps} />)

    fireEvent.keyDown(screen.getByLabelText('输入消息'), { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
