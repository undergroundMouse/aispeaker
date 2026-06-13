// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ChatBubble } from './ChatBubble'

describe('ChatBubble', () => {
  afterEach(() => cleanup())

  it('renders user and assistant with distinct roles', () => {
    const { rerender } = render(<ChatBubble language="zh" role="user" text="你好" />)
    expect(screen.getByText('你')).toBeTruthy()
    expect(document.querySelector('.chat-message--user')).toBeTruthy()

    rerender(<ChatBubble language="zh" role="assistant" text="你好。" isStreaming />)
    expect(screen.getByText('AI')).toBeTruthy()
    expect(document.querySelector('.chat-message--assistant.chat-message--streaming')).toBeTruthy()
  })
})
