import type { VisualAnswer } from '../types'
import type { VlCorrectionMode } from '../config/featureFlags'

export function shouldSpeakVisualCorrection(mode: VlCorrectionMode): boolean {
  return mode === 'spoken'
}

export function visualAnswersMateriallyDiffer(visualAnswer: VisualAnswer, spokenText: string): boolean {
  const spoken = spokenText.trim().toLocaleLowerCase()
  const verified = visualAnswer.answer.trim().toLocaleLowerCase()
  if (!verified || !spoken) {
    return false
  }

  if (spoken.includes(verified) || verified.includes(spoken.slice(0, Math.min(spoken.length, 24)))) {
    return false
  }

  return true
}

export function buildVisualCorrectionInstruction(visualAnswer: VisualAnswer, language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return `视觉验证更新：${visualAnswer.answer}。如与刚才回答不一致，请简要更正。`
  }

  return `Visual verification update: ${visualAnswer.answer}. Briefly correct your prior answer if it differs.`
}
