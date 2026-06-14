import type { PointerEvent } from 'react'
import { useCallback, useRef } from 'react'

export interface UsePushToTalkButtonOptions {
  microphoneReady: boolean
  onStartPushToTalk: () => void
  onStopPushToTalk: () => void
}

export function usePushToTalkButton({
  microphoneReady,
  onStartPushToTalk,
  onStopPushToTalk,
}: UsePushToTalkButtonOptions) {
  const activeRef = useRef(false)

  const stopIfActive = useCallback(() => {
    if (!activeRef.current) {
      return
    }

    activeRef.current = false
    onStopPushToTalk()
  }, [onStopPushToTalk])

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!microphoneReady || activeRef.current) {
        return
      }

      event.preventDefault()
      activeRef.current = true
      if (typeof event.currentTarget.setPointerCapture === 'function') {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      onStartPushToTalk()
    },
    [microphoneReady, onStartPushToTalk],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!activeRef.current) {
        return
      }

      if (
        typeof event.currentTarget.hasPointerCapture === 'function' &&
        event.currentTarget.hasPointerCapture(event.pointerId) &&
        typeof event.currentTarget.releasePointerCapture === 'function'
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      stopIfActive()
    },
    [stopIfActive],
  )

  const handlePointerCancel = useCallback(() => {
    stopIfActive()
  }, [stopIfActive])

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (
        typeof event.currentTarget.hasPointerCapture === 'function' &&
        event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        return
      }

      stopIfActive()
    },
    [stopIfActive],
  )

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
  }
}
