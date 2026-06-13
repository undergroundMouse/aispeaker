import type {
  AppLanguage,
  CloudVisualAnswerFrame,
  LocalVisionHints,
  VisualAnswer,
  VisualAnswerKind,
  VisionCandidate,
  VisionRegion,
} from '@ai/shared'

const OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT = "If you are not sure, say '看不清楚'."
export const UNCERTAIN_OBJECT_ANSWER_ZH = '看不清楚'

const OBJECT_QUESTION_PHRASES = ['这是什么', 'what is this', 'what is that', '这是啥']

export function isObjectQuestion(transcript: string): boolean {
  const normalized = transcript.trim().toLocaleLowerCase()
  return OBJECT_QUESTION_PHRASES.some((phrase) => normalized.includes(phrase))
}

export function buildObjectRecognitionPrompt(transcript: string, language: AppLanguage): string {
  const base =
    language === 'zh'
      ? `请识别用户问题中的物体：${transcript}`
      : `Identify the object in the user's question: ${transcript}`

  return `${base}\n\n${OBJECT_RECOGNITION_UNCERTAINTY_CONSTRAINT}`
}

export function isUncertainObjectAnswer(answer: string): boolean {
  const normalized = answer.trim().toLocaleLowerCase()
  return (
    normalized.includes('看不清楚') ||
    normalized.includes("can't see clearly") ||
    normalized.includes('cannot see clearly')
  )
}

export interface QwenProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface QwenVisualInput {
  transcript: string
  language: AppLanguage
  frame?: CloudVisualAnswerFrame | null
  localVisionHints: LocalVisionHints
  longTermMemoryContext?: string | null
}

interface QwenStructuredAnswer {
  kind?: VisualAnswerKind
  answer?: string
  explanation?: string
  confidence?: number
  regions?: VisionRegion[]
  label?: string
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
      reasoning_content?: string
    }
  }>
  usage?: { total_tokens?: number }
  error?: { message?: string }
}

export class QwenVisualLanguageProvider {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly fetchImpl: typeof fetch

  constructor(config: QwenProviderConfig, fetchImpl: typeof fetch = fetch) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.model = config.model
    this.fetchImpl = fetchImpl
  }

  async answerVisualQuestion(input: QwenVisualInput): Promise<{ answer: VisualAnswer; actualTokens?: number }> {
    const prompt = buildQwenVisualPrompt(input)
    const messages = buildChatMessages(input, prompt)
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, messages, temperature: 0.2 }),
    })

    const payload = (await response.json()) as OpenAIChatCompletionResponse
    if (!response.ok) {
      const message = payload.error?.message ?? `Qwen API request failed with status ${response.status}`
      const error = new Error(message)
      Object.assign(error, { status: response.status })
      throw error
    }

    const message = payload.choices?.[0]?.message
    const content = extractMessageText(message?.content)
    const reasoning = message?.reasoning_content?.trim()
    const parsed = parseStructuredAnswer(content, reasoning, input.language)
    const normalized = normalizeCloudVisualAnswer(finalizeVisualAnswer(parsed, input.language), input.language)

    if (normalized.kind === 'object' && isUncertainObjectAnswer(normalized.answer)) {
      return {
        answer: normalizeCloudVisualAnswer(
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
            input.language,
          ),
          input.language,
        ),
        actualTokens: payload.usage?.total_tokens,
      }
    }

    return { answer: normalized, actualTokens: payload.usage?.total_tokens }
  }
}

export function buildQwenVisualPrompt(input: QwenVisualInput): string {
  const objectPrompt = isObjectQuestion(input.transcript.trim().toLocaleLowerCase())
    ? buildObjectRecognitionPrompt(input.transcript, input.language)
    : input.transcript

  const languageInstruction =
    input.language === 'zh'
      ? '请用中文回答，语气简洁，适合语音播报。'
      : 'Answer in concise English suitable for speech playback.'

  const localContext = formatLocalVisionContext(input.localVisionHints)
  const memoryContext = input.longTermMemoryContext?.trim()

  return [
    'You are a realtime vision assistant helping a blind or low-vision user understand the camera view.',
    languageInstruction,
    'Return ONLY valid JSON with this schema:',
    '{ "kind": "object|scene|gesture|general", "answer": "...", "explanation": "...", "confidence": 0.0-1.0, "label": "...", "regions": [{ "x": 0-1, "y": 0-1, "width": 0-1, "height": 0-1, "label": "..." }] }',
    'Rules:',
    '- Coordinates must be normalized between 0 and 1 relative to the image.',
    '- Include at most 3 regions and only when you can ground the answer visually.',
    '- If you cannot identify an object clearly, set answer to "看不清楚" and regions to [].',
    '- Do not wrap JSON in markdown.',
    memoryContext ? `Relevant memory:\n${memoryContext}` : '',
    localContext ? `Local vision hints:\n${localContext}` : '',
    `User question: ${objectPrompt}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildChatMessages(
  input: QwenVisualInput,
  prompt: string,
): Array<{ role: 'user'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> {
  if (!input.frame) {
    return [{ role: 'user', content: prompt }]
  }

  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: input.frame.dataUrl } },
      ],
    },
  ]
}

function formatLocalVisionContext(hints: LocalVisionHints): string {
  const candidates = [
    ...hints.objectCandidates.slice(0, 3),
    ...hints.sceneCandidates.slice(0, 2),
    ...hints.gestures.slice(0, 2),
  ]

  if (candidates.length === 0) {
    return ''
  }

  return candidates
    .map((candidate) => `${candidate.label} (${Math.round(candidate.confidence * 100)}%)`)
    .join(', ')
}

function parseStructuredAnswer(
  content: string,
  reasoning: string | undefined,
  language: AppLanguage,
): Omit<VisualAnswer, 'evidenceAvailable'> {
  const structured = extractJsonObject(content)
  if (!structured?.answer?.trim()) {
    return {
      kind: 'general',
      answer: content.trim() || (language === 'zh' ? '云端暂时无法回答。' : 'Cloud response unavailable.'),
      explanation: reasoning,
      source: 'cloud',
      referencedEntities: [],
      regions: [],
      requiresSpeech: true,
    }
  }

  const label = structured.label?.trim() || structured.regions?.[0]?.label || 'target'
  const confidence = clampConfidence(structured.confidence)
  const regions = sanitizeRegions(structured.regions)
  const referencedEntities: VisionCandidate[] =
    regions.length > 0
      ? regions.map((region) => ({ label: region.label ?? label, confidence, region }))
      : [{ label, confidence }]

  return {
    kind: structured.kind ?? (isUncertainObjectAnswer(structured.answer) ? 'object' : 'general'),
    answer: structured.answer.trim(),
    explanation: structured.explanation?.trim() || reasoning,
    source: 'cloud',
    confidence,
    referencedEntities,
    regions,
    requiresSpeech: true,
  }
}

function finalizeVisualAnswer(
  answer: Omit<VisualAnswer, 'evidenceAvailable'> & { evidenceAvailable?: boolean },
  _language: AppLanguage,
): VisualAnswer {
  const regions = trimEvidenceRegions(answer.regions)
  const evidenceAvailable = Boolean(answer.evidenceAvailable ?? regions.length > 0)
  return {
    ...answer,
    regions: evidenceAvailable ? regions : [],
    evidenceAvailable,
    explanation: answer.explanation,
  }
}

function normalizeCloudVisualAnswer(answer: VisualAnswer, _language: AppLanguage): VisualAnswer {
  const regions = trimEvidenceRegions(answer.regions)
  const hasValidRegions = regions.length > 0
  if (!hasValidRegions) {
    return { ...answer, regions: [], evidenceAvailable: false }
  }
  return finalizeVisualAnswer({ ...answer, regions, evidenceAvailable: true }, _language)
}

function trimEvidenceRegions(regions: VisionRegion[]): VisionRegion[] {
  return regions
    .filter((r) => r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0)
    .slice(0, 3)
}

function extractJsonObject(content: string): QwenStructuredAnswer | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const candidates = [trimmed]
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.unshift(fenced[1].trim())
  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) candidates.push(objectMatch[0])

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as QwenStructuredAnswer
    } catch {
      continue
    }
  }
  return null
}

function extractMessageText(content: string | Array<{ type?: string; text?: string }> | undefined): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  return content.map((part) => (part.type === 'text' ? part.text ?? '' : '')).join('').trim()
}

function sanitizeRegions(regions: VisionRegion[] | undefined): VisionRegion[] {
  if (!regions?.length) return []
  return regions
    .filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y) && r.width > 0 && r.height > 0)
    .map((r) => ({
      x: clampUnit(r.x),
      y: clampUnit(r.y),
      width: clampUnit(r.width),
      height: clampUnit(r.height),
      label: r.label,
    }))
}

function clampConfidence(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0.75
  return Math.min(1, Math.max(0, value))
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}
