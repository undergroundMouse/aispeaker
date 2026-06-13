import type {
  ActiveVisualEvidence,
  AppLanguage,
  ConversationMemoryEntry,
  ConversationMemoryState,
  VisualAnswer,
  VisionRegion,
} from '../types'
import { normalizePhrase } from '../voice/localCommands'

export const MAX_EVIDENCE_REGIONS = 3
export const MAX_EVIDENCE_PAYLOAD_BYTES = 200
export const VISUAL_EVIDENCE_TTL_MS = 8_000

const WHY_FOLLOW_UP_PHRASES = [
  '为什么你觉得',
  '为什么',
  'why do you think',
  'why is it',
  'why',
]

export function buildLocalExplanation(
  label: string,
  confidence: number | undefined,
  language: AppLanguage,
): string {
  const confidenceText =
    confidence === undefined
      ? ''
      : language === 'zh'
        ? `，置信度约 ${Math.round(confidence * 100)}%`
        : `, with about ${Math.round(confidence * 100)}% confidence`

  return language === 'zh'
    ? `因为画面中的 ${label} 区域与识别特征匹配${confidenceText}。`
    : `Because the ${label} region in the frame matches the detected features${confidenceText}.`
}

export function trimEvidenceRegions(regions: VisionRegion[]): VisionRegion[] {
  return regions
    .filter(isValidEvidenceRegion)
    .slice(0, MAX_EVIDENCE_REGIONS)
    .map((region) => ({
      x: roundCoordinate(region.x),
      y: roundCoordinate(region.y),
      width: roundCoordinate(region.width),
      height: roundCoordinate(region.height),
      label: region.label,
    }))
}

export function serializeEvidencePayload(regions: VisionRegion[]): string {
  return JSON.stringify(trimEvidenceRegions(regions))
}

export function isEvidencePayloadWithinBudget(regions: VisionRegion[]): boolean {
  return new TextEncoder().encode(serializeEvidencePayload(regions)).length <= MAX_EVIDENCE_PAYLOAD_BYTES
}

export function uncertaintyAnswer(language: AppLanguage): string {
  return language === 'zh' ? '我不确定原因。' : 'I am not sure why.'
}

export function isWhyFollowUpQuestion(transcript: string): boolean {
  const normalized = normalizePhrase(transcript)
  return WHY_FOLLOW_UP_PHRASES.some((phrase) => normalized.includes(phrase))
}

export function resolveWhyFollowUpEvidence(memory: ConversationMemoryState): ConversationMemoryEntry | null {
  return (
    memory.entries.find(
      (entry) =>
        ['object', 'scene', 'gesture'].includes(entry.kind) && entry.evidenceAvailable && entry.region,
    ) ?? null
  )
}

export function finalizeVisualAnswer(
  answer: Omit<VisualAnswer, 'evidenceAvailable'> & { evidenceAvailable?: boolean },
  language: AppLanguage,
): VisualAnswer {
  const regions = trimEvidenceRegions(answer.regions)
  const withinBudget = isEvidencePayloadWithinBudget(regions)
  const evidenceAvailable = Boolean(answer.evidenceAvailable ?? (regions.length > 0 && withinBudget))
  const safeRegions = evidenceAvailable ? regions : []
  const explanation =
    answer.explanation ??
    (evidenceAvailable && answer.referencedEntities[0]
      ? buildLocalExplanation(
          answer.referencedEntities[0].label,
          answer.confidence ?? answer.referencedEntities[0].confidence,
          language,
        )
      : undefined)

  return {
    ...answer,
    regions: safeRegions,
    evidenceAvailable,
    explanation,
  }
}

export function normalizeCloudVisualAnswer(answer: VisualAnswer, language: AppLanguage): VisualAnswer {
  const regions = trimEvidenceRegions(answer.regions)
  const hasValidRegions = regions.length > 0 && isEvidencePayloadWithinBudget(regions)

  if (!hasValidRegions) {
    return {
      ...answer,
      regions: [],
      evidenceAvailable: false,
      explanation: answer.explanation,
    }
  }

  return finalizeVisualAnswer(
    {
      ...answer,
      regions,
      evidenceAvailable: true,
    },
    language,
  )
}

export function buildWhyFollowUpAnswer(
  transcript: string,
  memory: ConversationMemoryState,
  language: AppLanguage,
): VisualAnswer | null {
  if (!isWhyFollowUpQuestion(transcript)) {
    return null
  }

  const referenced = resolveWhyFollowUpEvidence(memory)
  if (!referenced?.region) {
    const uncertainty = uncertaintyAnswer(language)
    return {
      kind: 'clarification',
      answer: uncertainty,
      explanation: uncertainty,
      source: 'memory',
      referencedEntities: [],
      regions: [],
      evidenceAvailable: false,
      requiresSpeech: true,
    }
  }

  const explanation =
    referenced.explanation ?? buildLocalExplanation(referenced.label, referenced.confidence, language)

  return finalizeVisualAnswer(
    {
      kind:
        referenced.kind === 'object' || referenced.kind === 'scene' || referenced.kind === 'gesture'
          ? referenced.kind
          : 'general',
      answer: explanation,
      explanation,
      source: 'memory',
      confidence: referenced.confidence,
      referencedEntities: [
        {
          label: referenced.label,
          confidence: referenced.confidence ?? 1,
          region: referenced.region,
        },
      ],
      regions: [referenced.region],
      evidenceAvailable: true,
      requiresSpeech: true,
    },
    language,
  )
}

export function buildSpeakableAnswerText(answer: VisualAnswer): string {
  if (!answer.explanation || !answer.evidenceAvailable) {
    return answer.answer
  }

  if (answer.answer.includes(answer.explanation)) {
    return answer.answer
  }

  return `${answer.answer} ${answer.explanation}`.trim()
}

export function createActiveVisualEvidence(
  answer: VisualAnswer,
  capturedAt: number,
): ActiveVisualEvidence | null {
  if (!answer.evidenceAvailable || answer.regions.length === 0) {
    return null
  }

  return {
    regions: answer.regions,
    explanation: answer.explanation,
    capturedAt,
    expiresAt: capturedAt + VISUAL_EVIDENCE_TTL_MS,
    evidenceAvailable: true,
  }
}

export function isVisualEvidenceExpired(evidence: ActiveVisualEvidence, now = Date.now()): boolean {
  return now >= evidence.expiresAt
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000
}

function isValidEvidenceRegion(region: VisionRegion): boolean {
  return (
    region.width > 0 &&
    region.height > 0 &&
    region.x >= 0 &&
    region.y >= 0 &&
    region.x + region.width <= 1.001 &&
    region.y + region.height <= 1.001
  )
}
