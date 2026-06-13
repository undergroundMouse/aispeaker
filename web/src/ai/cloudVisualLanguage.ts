import type { CloudVisualLanguageProvider, CloudVisualQuestionRequest, VisualAnswer } from '../types'
import { getTopCandidate } from './localVision'
import { finalizeVisualAnswer, normalizeCloudVisualAnswer } from './visualEvidence'

export class MockCloudVisualLanguageProvider implements CloudVisualLanguageProvider {
  async answerVisualQuestion({
    transcript,
    localVision,
    language,
  }: CloudVisualQuestionRequest): Promise<VisualAnswer> {
    const object = getTopCandidate(localVision.objectCandidates)
    const scene = getTopCandidate(localVision.sceneCandidates)
    const candidate = object ?? scene

    if (candidate) {
      const explanation =
        language === 'zh'
          ? `因为识别到了 ${candidate.label} 的形状和位置特征。`
          : `Because the shape and position features match ${candidate.label}.`

      return normalizeCloudVisualAnswer(
        finalizeVisualAnswer(
          {
            kind: object ? 'object' : 'scene',
            answer:
              language === 'zh'
                ? `云端视觉模型判断为 ${candidate.label}。`
                : `The cloud visual model identifies ${candidate.label}.`,
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
            ? `云端视觉模型已处理问题：“${transcript}”。`
            : `The cloud visual model processed: "${transcript}".`,
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
  return normalizeCloudVisualAnswer(answer, language)
}
