import type {
  AppLanguage,
  CloudVisualLanguageProvider,
  CloudVisualQuestionRequest,
  LocalVisionSignals,
  VisualAnswer,
  VisualAnswerKind,
  VisionCandidate,
  VisionRegion,
} from '../types'
import { buildObjectRecognitionPrompt, isUncertainObjectAnswer, UNCERTAIN_OBJECT_ANSWER_ZH } from './objectRecognitionPrompt'
import { isObjectQuestion } from './localVision'
import { finalizeVisualAnswer, normalizeCloudVisualAnswer } from './visualEvidence'
import type { QwenCloudProviderConfig } from './cloudProviderConfig'

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
  usage?: {
    total_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
  }
  error?: {
    message?: string
  }
}

export interface QwenCloudVisualLanguageProviderOptions extends QwenCloudProviderConfig {
  fetchImpl?: typeof fetch
}

export class QwenCloudVisualLanguageProvider implements CloudVisualLanguageProvider {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly fetchImpl: typeof fetch
  private lastUsageTokens: number | undefined

  constructor({
    apiKey,
    baseUrl,
    model,
    fetchImpl = fetch,
  }: QwenCloudVisualLanguageProviderOptions) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.model = model
    this.fetchImpl = fetchImpl
  }

  getLastUsageTokens(): number | undefined {
    return this.lastUsageTokens
  }

  async answerVisualQuestion(request: CloudVisualQuestionRequest): Promise<VisualAnswer> {
    const prompt = buildQwenVisualPrompt(request)
    const messages = await buildChatMessages(request, prompt)
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
      }),
    })

    const payload = (await response.json()) as OpenAIChatCompletionResponse
    if (!response.ok) {
      const message = payload.error?.message ?? `Qwen API request failed with status ${response.status}`
      const error = new Error(message)
      Object.assign(error, { status: response.status })
      throw error
    }

    this.lastUsageTokens = payload.usage?.total_tokens

    const message = payload.choices?.[0]?.message
    const content = extractMessageText(message?.content)
    const reasoning = message?.reasoning_content?.trim()
    const parsed = parseStructuredAnswer(content, reasoning, request.language)
    const normalized = normalizeCloudVisualAnswer(
      finalizeVisualAnswer(parsed, request.language),
      request.language,
    )

    if (normalized.kind === 'object' && isUncertainObjectAnswer(normalized.answer)) {
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
          request.language,
        ),
        request.language,
      )
    }

    return normalized
  }
}

export function buildQwenVisualPrompt(request: CloudVisualQuestionRequest): string {
  const normalizedTranscript = request.transcript.trim()
  const objectPrompt = isObjectQuestion(normalizedTranscript.toLocaleLowerCase())
    ? buildObjectRecognitionPrompt(request.transcript, request.language)
    : normalizedTranscript

  const languageInstruction =
    request.language === 'zh'
      ? '请用中文回答，语气简洁，适合语音播报。'
      : 'Answer in concise English suitable for speech playback.'

  const localContext = formatLocalVisionContext(request.localVision)
  const memoryContext = request.longTermMemoryContext?.promptText?.trim()

  return [
    'You are a realtime vision assistant helping a blind or low-vision user understand the camera view.',
    languageInstruction,
    'Return ONLY valid JSON with this schema:',
    '{',
    '  "kind": "object" | "scene" | "gesture" | "general",',
    '  "answer": "short spoken answer",',
    '  "explanation": "brief reason for the answer",',
    '  "confidence": 0.0-1.0,',
    '  "label": "primary entity label",',
    '  "regions": [{ "x": 0-1, "y": 0-1, "width": 0-1, "height": 0-1, "label": "entity" }]',
    '}',
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

async function buildChatMessages(
  request: CloudVisualQuestionRequest,
  prompt: string,
): Promise<Array<{ role: 'user'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>> {
  if (!request.frame) {
    return [{ role: 'user', content: prompt }]
  }

  const imageUrl = await frameToDataUrl(request.frame)
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ]
}

function formatLocalVisionContext(localVision: LocalVisionSignals): string {
  const candidates = [
    ...localVision.objectCandidates.slice(0, 3),
    ...localVision.sceneCandidates.slice(0, 2),
    ...localVision.gestures.slice(0, 2).map((gesture) => ({
      label: gesture.label,
      confidence: gesture.confidence,
      region: undefined,
    })),
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
    const fallbackAnswer = content.trim() || (language === 'zh' ? '云端暂时无法回答。' : 'Cloud response unavailable.')
    return {
      kind: 'general',
      answer: fallbackAnswer,
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
      ? regions.map((region) => ({
          label: region.label ?? label,
          confidence,
          region,
          source: 'cloud',
        }))
      : label
        ? [{ label, confidence, source: 'cloud' }]
        : []

  return {
    kind: structured.kind ?? inferKind(structured.answer),
    answer: structured.answer.trim(),
    explanation: structured.explanation?.trim() || reasoning,
    source: 'cloud',
    confidence,
    referencedEntities,
    regions,
    requiresSpeech: true,
  }
}

function extractJsonObject(content: string): QwenStructuredAnswer | null {
  const trimmed = content.trim()
  if (!trimmed) {
    return null
  }

  const candidates = [trimmed]
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    candidates.unshift(fenced[1].trim())
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0])
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as QwenStructuredAnswer
    } catch {
      continue
    }
  }

  return null
}

function extractMessageText(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  return content
    .map((part) => (part.type === 'text' ? part.text ?? '' : ''))
    .join('')
    .trim()
}

function sanitizeRegions(regions: VisionRegion[] | undefined): VisionRegion[] {
  if (!regions?.length) {
    return []
  }

  return regions
    .filter(
      (region) =>
        Number.isFinite(region.x) &&
        Number.isFinite(region.y) &&
        Number.isFinite(region.width) &&
        Number.isFinite(region.height) &&
        region.width > 0 &&
        region.height > 0,
    )
    .map((region) => ({
      x: clampUnit(region.x),
      y: clampUnit(region.y),
      width: clampUnit(region.width),
      height: clampUnit(region.height),
      label: region.label,
    }))
}

function inferKind(answer: string): VisualAnswerKind {
  if (isUncertainObjectAnswer(answer)) {
    return 'object'
  }

  return 'general'
}

function clampConfidence(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0.75
  }

  return Math.min(1, Math.max(0, value))
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

async function frameToDataUrl(frame: CloudVisualQuestionRequest['frame']): Promise<string> {
  if (!frame) {
    throw new Error('Frame is required to build image payload.')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read frame blob.'))
    reader.readAsDataURL(frame.blob)
  })
}
