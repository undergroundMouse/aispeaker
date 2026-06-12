import type { CameraErrorCode } from './types'

export const CAMERA_ERROR_MESSAGES: Record<CameraErrorCode, string> = {
  permission_denied: '需要摄像头权限才能使用视觉功能，请在浏览器设置中允许访问摄像头。',
  device_not_found: '未检测到可用摄像头，请确认设备已连接。',
  device_busy: '摄像头正被其他应用占用，请关闭后重试。',
  unknown: '无法打开摄像头，请稍后重试。',
}

export function mapMediaError(err: unknown): { code: CameraErrorCode } {
  const name = err instanceof DOMException ? err.name : ''

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return { code: 'permission_denied' }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return { code: 'device_not_found' }
    case 'NotReadableError':
    case 'TrackStartError':
      return { code: 'device_busy' }
    default:
      return { code: 'unknown' }
  }
}
