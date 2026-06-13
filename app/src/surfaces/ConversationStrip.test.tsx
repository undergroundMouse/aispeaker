// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConversationStrip } from './assist/ConversationStrip'

describe('ConversationStrip', () => {
  it('renders role-specific classes for assistant and system failures', () => {
    const { rerender } = render(
      <ConversationStrip
        language="zh"
        entries={[
          {
            id: 'assistant',
            role: 'assistant',
            text: '这是一个杯子。',
          },
        ]}
      />,
    )

    expect(screen.getByText('这是一个杯子。').closest('.conversation-entry--assistant')).toBeTruthy()

    rerender(
      <ConversationStrip
        language="zh"
        entries={[
          {
            id: 'system',
            role: 'system',
            text: '网络不佳，请重试',
            systemVariant: 'network',
          },
        ]}
      />,
    )

    expect(screen.getByText('网络不佳，请重试').closest('.conversation-entry--network')).toBeTruthy()

    rerender(
      <ConversationStrip
        language="zh"
        entries={[
          {
            id: 'budget',
            role: 'system',
            text: '今日云端预算已用尽',
            systemVariant: 'budget',
          },
        ]}
      />,
    )

    expect(screen.getByText('今日云端预算已用尽').closest('.conversation-entry--budget')).toBeTruthy()
  })
})
