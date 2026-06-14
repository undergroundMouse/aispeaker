// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryPage } from './MemoryPage'

const baseProps = {
  language: 'zh' as const,
  learnedCustomObjects: [{ id: 'obj-1', name: '小红杯' } as never],
  longTermMemories: [
    {
      id: 'ltm-1',
      userId: 'local-user',
      type: 'preference' as const,
      summary: '用户喜欢红色。',
      tags: ['red'],
      strength: 1,
      syncEligible: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsedAt: Date.now(),
    },
  ],
  longTermMemoryStatus: { available: true, message: null },
  longTermMemoryConsent: { cloudMemoryAccess: false, cloudSummarySync: false },
  staleLongTermCount: 2,
  onBack: vi.fn(),
  onDeleteCustomObject: vi.fn(),
  onExportCustomObjects: vi.fn(),
  onDeleteLongTermMemory: vi.fn(),
  onForgetAllLongTermMemories: vi.fn(),
  onExportLongTermMemories: vi.fn(),
}

describe('MemoryPage', () => {
  afterEach(() => cleanup())

  it('renders learned objects and long-term memory lists', () => {
    render(<MemoryPage {...baseProps} />)

    expect(screen.getByText('小红杯')).toBeTruthy()
    expect(screen.getByText('用户喜欢红色。')).toBeTruthy()
    expect(screen.getByText('导出已学物体')).toBeTruthy()
    expect(screen.getByText('导出长期记忆')).toBeTruthy()
  })

  it('shows stale memory warning when count is positive', () => {
    render(<MemoryPage {...baseProps} />)

    expect(screen.getByText((content) => content.includes('2') && content.includes('30'))).toBeTruthy()
  })

  it('calls back navigation handler', () => {
    const onBack = vi.fn()
    render(<MemoryPage {...baseProps} onBack={onBack} />)

    fireEvent.click(screen.getByText('返回 Assist'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
