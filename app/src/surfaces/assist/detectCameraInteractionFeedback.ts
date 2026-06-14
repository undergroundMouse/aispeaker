import type { AppLanguage } from '../../types'
import type { CameraInteractionFeedback } from './presentationTypes'

export function detectCameraInteractionFeedback(
  feedback: string,
  language: AppLanguage,
): CameraInteractionFeedback {
  if (!feedback) {
    return { kind: 'none' }
  }

  const successPatterns =
    language === 'zh'
      ? ['已记住', '已选择画面中央物体区域', '已取消框选']
      : ['I remembered', 'Selected the center object region', 'Selection cleared']
  const failurePatterns =
    language === 'zh'
      ? ['请先框选', '请告诉我', '当前没有可用画面', '不可用']
      : ['Please select', 'Please tell me', 'No current frame', 'unavailable']

  if (successPatterns.some((pattern) => feedback.includes(pattern))) {
    return { kind: 'success', message: feedback }
  }

  if (failurePatterns.some((pattern) => feedback.includes(pattern))) {
    return { kind: 'failure', message: feedback }
  }

  return { kind: 'none' }
}
