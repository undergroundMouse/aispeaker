import type { VoiceErrorCode } from './types'

export const VOICE_ERROR_MESSAGES: Record<VoiceErrorCode, string> = {
  permission_denied: '需要麦克风权限才能使用语音功能，请在浏览器设置中允许访问麦克风。',
  device_not_found: '未检测到可用麦克风，请确认设备已连接。',
  device_busy: '麦克风正被其他应用占用，请关闭后重试。',
  transcription_failed: '未能识别语音内容，请重试。',
  wake_unavailable: '当前环境不支持语音唤醒，请使用按键说话。',
  unknown: '语音输入出现问题，请稍后重试。',
}

export function mapVoiceMediaError(err: unknown): { code: VoiceErrorCode } {
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
