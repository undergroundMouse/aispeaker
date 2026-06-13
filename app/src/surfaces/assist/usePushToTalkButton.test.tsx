// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePushToTalkButton } from './usePushToTalkButton'

function PushToTalkHarness(props: Parameters<typeof usePushToTalkButton>[0]) {
  const { handlePointerDown, handlePointerUp, handlePointerCancel, handlePointerLeave } = usePushToTalkButton(props)
  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
    >
      talk
    </button>
  )
}

describe('usePushToTalkButton', () => {
  afterEach(() => cleanup())

  it('starts on pointer down and stops on pointer up', () => {
    const onStartPushToTalk = vi.fn()
    const onStopPushToTalk = vi.fn()
    const { getByText } = render(
      <PushToTalkHarness
        microphoneReady
        onStartPushToTalk={onStartPushToTalk}
        onStopPushToTalk={onStopPushToTalk}
      />,
    )

    const button = getByText('talk')
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse' })
    expect(onStartPushToTalk).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse' })
    expect(onStopPushToTalk).toHaveBeenCalledTimes(1)
  })

  it('stops capture when pointer is cancelled', () => {
    const onStartPushToTalk = vi.fn()
    const onStopPushToTalk = vi.fn()
    const { getByText } = render(
      <PushToTalkHarness
        microphoneReady
        onStartPushToTalk={onStartPushToTalk}
        onStopPushToTalk={onStopPushToTalk}
      />,
    )

    const button = getByText('talk')
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerCancel(button, { pointerId: 1, pointerType: 'mouse' })
    expect(onStopPushToTalk).toHaveBeenCalledTimes(1)
  })

  it('keeps capture active on pointer leave while pointer is captured', () => {
    const onStartPushToTalk = vi.fn()
    const onStopPushToTalk = vi.fn()
    const { getByText } = render(
      <PushToTalkHarness
        microphoneReady
        onStartPushToTalk={onStartPushToTalk}
        onStopPushToTalk={onStopPushToTalk}
      />,
    )

    const button = getByText('talk')
    button.setPointerCapture = vi.fn()
    button.hasPointerCapture = vi.fn(() => true)
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerLeave(button, { pointerId: 1, pointerType: 'mouse' })

    expect(onStopPushToTalk).not.toHaveBeenCalled()
  })

  it('stops capture on pointer leave when pointer is not captured', () => {
    const onStartPushToTalk = vi.fn()
    const onStopPushToTalk = vi.fn()
    const { getByText } = render(
      <PushToTalkHarness
        microphoneReady
        onStartPushToTalk={onStartPushToTalk}
        onStopPushToTalk={onStopPushToTalk}
      />,
    )

    const button = getByText('talk')
    button.hasPointerCapture = vi.fn(() => false)
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerLeave(button, { pointerId: 1, pointerType: 'mouse' })

    expect(onStopPushToTalk).toHaveBeenCalledTimes(1)
  })
})
