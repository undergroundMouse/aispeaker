// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProactiveBanner } from './ProactiveBanner'

describe('ProactiveBanner', () => {
  it('renders proactive text outside caption layer component', () => {
    render(
      <ProactiveBanner
        language="zh"
        banner={{ visible: true, text: '快递员似乎在门口', promptId: 'prompt-1' }}
      />,
    )

    expect(screen.getByText('快递员似乎在门口').closest('.proactive-banner')).toBeTruthy()
  })

  it('hides when banner state is not visible', () => {
    const { container } = render(
      <ProactiveBanner
        language="zh"
        banner={{ visible: false, text: '快递员似乎在门口', promptId: 'prompt-1' }}
      />,
    )

    expect(container.querySelector('.proactive-banner')).toBeNull()
  })
})
