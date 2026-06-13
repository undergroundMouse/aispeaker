import type { CloudVisualLanguageProvider, CloudVisualQuestionRequest, VisualAnswer } from '../types'
import { buildObjectRecognitionPrompt, isUncertainObjectAnswer, UNCERTAIN_OBJECT_ANSWER_ZH } from './objectRecognitionPrompt'
import { getTopCandidate, isObjectQuestion } from './localVision'
import { finalizeVisualAnswer, normalizeCloudVisualAnswer } from './visualEvidence'

export class MockCloudVisualLanguageProvider implements CloudVisualLanguageProvider {
  private readonly forceUncertainty: boolean

  constructor(options: { forceUncertainty?: boolean } = {}) {
    this.forceUncertainty = options.forceUncertainty ?? false
  }

  async answerVisualQuestion({
    transcript,
    localVision,
    language,
  }: CloudVisualQuestionRequest): Promise<VisualAnswer> {
    const objectPrompt = isObjectQuestion(transcript.trim().toLocaleLowerCase())
      ? buildObjectRecognitionPrompt(transcript, language)
      : transcript

    if (this.forceUncertainty && isObjectQuestion(transcript.trim().toLocaleLowerCase())) {
      return normalizeCloudVisualAnswer(
        finalizeVisualAnswer(
          {
            kind: 'object',
            answer: UNCERTAIN_OBJECT_ANSWER_ZH,
            source: 'cloud',
            referencedEntities: [],
            regions: [],
            evidenceAvailable: false,
            requiresSpeech: true,
          },
          language,
        ),
        language,
      )
    }

    const object = getTopCandidate(localVision.objectCandidates)
    const scene = getTopCandidate(localVision.sceneCandidates)
    const candidate = object ?? scene

    if (candidate) {
      const explanation =
        language === 'zh'
          ? `因为识别到了 ${candidate.label} 的形状和位置特征。`
          : `Because the shape and position features match ${candidate.label}.`

      const answerText =
        language === 'zh'
          ? `云端视觉模型判断为 ${candidate.label}。`
          : `The cloud visual model identifies ${candidate.label}.`

      if (isUncertainObjectAnswer(answerText)) {
        return normalizeCloudVisualAnswer(
          finalizeVisualAnswer(
            {
              kind: 'object',
              answer: UNCERTAIN_OBJECT_ANSWER_ZH,
              source: 'cloud',
              referencedEntities: [],
              regions: [],
              evidenceAvailable: false,
              requiresSpeech: true,
            },
            language,
          ),
          language,
        )
      }

      return normalizeCloudVisualAnswer(
        finalizeVisualAnswer(
          {
            kind: object ? 'object' : 'scene',
            answer: answerText,
            source: 'cloud',
            confidence: candidate.confidence,
            referencedEntities: [candidate],
            regions: candidate.region ? [candidate.region] : [],
            explanation,
            requiresSpeech: true,
          },
          language,
        ),
        language,
      )
    }

    return normalizeCloudVisualAnswer(
      {
        kind: 'general',
        answer:
          language === 'zh'
            ? `云端视觉模型已处理问题：“${objectPrompt}”。`
            : `The cloud visual model processed: "${objectPrompt}".`,
        source: 'cloud',
        referencedEntities: [],
        regions: [],
        evidenceAvailable: false,
        requiresSpeech: true,
      },
      language,
    )
  }
}

export function normalizeProviderVisualAnswer(answer: VisualAnswer, language: CloudVisualQuestionRequest['language']) {
  if (answer.kind === 'object' && isUncertainObjectAnswer(answer.answer)) {
    return normalizeCloudVisualAnswer(
      finalizeVisualAnswer(
        {
          ...answer,
          answer: UNCERTAIN_OBJECT_ANSWER_ZH,
          referencedEntities: [],
          regions: [],
          evidenceAvailable: false,
          explanation: undefined,
        },
        language,
      ),
      language,
    )
  }

  return normalizeCloudVisualAnswer(answer, language)
}
