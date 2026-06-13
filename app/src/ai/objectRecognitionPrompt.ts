export const OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT =
  "If you are not sure, say '看不清楚'."

export const UNCERTAIN_OBJECT_ANSWER_ZH = '看不清楚'

export function appendObjectRecognitionConstraint(prompt: string): string {
  return `${prompt.trim()}\n\n${OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT}`
}

export function isUncertainObjectAnswer(answer: string): boolean {
  const normalized = answer.trim().toLocaleLowerCase()
  return normalized.includes('看不清楚') || normalized.includes("can't see clearly") || normalized.includes('cannot see clearly')
}

export function buildObjectRecognitionPrompt(transcript: string, language: 'zh' | 'en'): string {
  const base =
    language === 'zh'
      ? `请识别用户问题中的物体：${transcript}`
      : `Identify the object in the user's question: ${transcript}`

  return appendObjectRecognitionConstraint(base)
}
