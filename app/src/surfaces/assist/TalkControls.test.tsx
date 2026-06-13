// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TalkControls } from './TalkControls'

describe('TalkControls', () => {
  afterEach(() => cleanup())

  it('shows teaching hint before a region is selected', () => {
    render(
      <TalkControls
        language="zh"
        hasSelectedRegion={false}
        onSelectCenteredObject={vi.fn()}
        onClearSelectedObject={vi.fn()}
      />,
    )

    expect(screen.getByText('框选中央物体')).toBeTruthy()
    expect(screen.queryByText('取消框选')).toBeNull()
    expect(screen.getByText('教学前请点击画面或框选物体区域。')).toBeTruthy()
  })

  it('shows clear selection button when a region is selected', () => {
    const onClearSelectedObject = vi.fn()
    render(
      <TalkControls
        language="zh"
        hasSelectedRegion
        onSelectCenteredObject={vi.fn()}
        onClearSelectedObject={onClearSelectedObject}
      />,
    )

    expect(screen.getByText('取消框选')).toBeTruthy()
    expect(screen.queryByText('教学前请点击画面或框选物体区域。')).toBeNull()

    fireEvent.click(screen.getByText('取消框选'))
    expect(onClearSelectedObject).toHaveBeenCalledTimes(1)
  })
})
