import type { DeviceStatus } from '../../types'
import { getMessages } from '../../i18n'
import type { AppLanguage } from '../../types'

export function formatPermissionStatus(language: AppLanguage, status: DeviceStatus): string {
  const text = getMessages(language)

  if (status === 'ready') {
    return text.permissionStatusReady
  }

  if (status === 'permission-denied') {
    return text.permissionStatusDenied
  }

  return text.permissionStatusUnavailable
}
