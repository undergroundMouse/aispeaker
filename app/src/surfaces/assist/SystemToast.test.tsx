// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SystemToast } from './SystemToast'

describe('SystemToast', () => {
  it('renders weak-network variant', () => {
    render(
      <SystemToast
        toast={{ visible: true, message: '网络不佳，请重试', variant: 'network' }}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('网络不佳，请重试').closest('.system-toast--network')).toBeTruthy()
  })

  it('renders budget variant and dismisses', () => {
    const onDismiss = vi.fn()
    render(
      <SystemToast
        toast={{ visible: true, message: '今日云端预算已用尽', variant: 'budget' }}
        onDismiss={onDismiss}
      />,
    )

    const toast = screen.getByText('今日云端预算已用尽').closest('.system-toast')
    expect(toast).toBeTruthy()
    fireEvent.click(toast!.querySelector('button')!)
    expect(onDismiss).toHaveBeenCalled()
  })
})
