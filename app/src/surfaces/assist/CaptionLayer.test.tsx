// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CaptionLayer } from './CaptionLayer'

describe('CaptionLayer', () => {
  it('renders streaming assistant text with cursor', () => {
    render(
      <CaptionLayer
        language="zh"
        turns={[
          {
            id: 'turn-1',
            userText: '这是什么',
            assistantText: '正在分析',
            assistantFinal: false,
            role: 'assistant',
          },
        ]}
      />,
    )

    expect(screen.getByText('正在分析')).toBeTruthy()
    expect(document.querySelector('.caption-turn--streaming')).toBeTruthy()
  })

  it('renders scrollable history with latest turn emphasized', () => {
    render(
      <CaptionLayer
        language="zh"
        turns={[
          {
            id: 'turn-2',
            assistantText: '最新回答',
            assistantFinal: true,
            role: 'assistant',
          },
          {
            id: 'turn-1',
            assistantText: '较早回答',
            assistantFinal: true,
            role: 'assistant',
          },
        ]}
      />,
    )

    expect(screen.getByText('最新回答').closest('.caption-turn--latest')).toBeTruthy()
    expect(screen.getByText('较早回答').closest('.caption-turn--history')).toBeTruthy()
    expect(document.querySelector('.caption-layer__scroll')).toBeTruthy()
  })
})
