import type { SystemToastState } from './presentationTypes'

export interface SystemToastProps {
  toast: SystemToastState
  onDismiss: () => void
}

export function SystemToast({ toast, onDismiss }: SystemToastProps) {
  if (!toast.visible) {
    return null
  }

  return (
    <div
      className={['system-toast', `system-toast--${toast.variant}`].join(' ')}
      role="alert"
      aria-live="assertive"
    >
      <p>{toast.message}</p>
      <button type="button" className="system-toast__dismiss" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
