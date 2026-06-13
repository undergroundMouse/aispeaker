import type { AppLanguage } from './types'

export const messages = {
  zh: {
    title: '实时视觉语音 AI 输入',
    subtitle: 'WebRTC 摄像头/麦克风采集、端侧简单指令、弱网降级和节能采样原型。',
    startPushToTalk: '按住说话',
    stopPushToTalk: '松开结束',
    retryNetwork: '网络不佳，请重试',
    watchOnly: '只看不对话',
    cameraUnavailable: '摄像头不可用',
    microphoneUnavailable: '麦克风不可用',
  },
  en: {
    title: 'Realtime Vision Voice AI Input',
    subtitle:
      'A WebRTC camera/microphone capture prototype with local commands, network fallback, and sampling throttles.',
    startPushToTalk: 'Hold to talk',
    stopPushToTalk: 'Release to stop',
    retryNetwork: 'Network is poor. Please try again.',
    watchOnly: 'Watch-only',
    cameraUnavailable: 'Camera unavailable',
    microphoneUnavailable: 'Microphone unavailable',
  },
} satisfies Record<AppLanguage, Record<string, string>>

export function getMessages(language: AppLanguage) {
  return messages[language]
}
