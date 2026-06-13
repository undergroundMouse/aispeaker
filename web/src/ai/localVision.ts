import type {
  AppLanguage,
  GestureDetection,
  LocalVisionAnalysisInput,
  LocalVisionAnalyzer,
  LocalVisionSignals,
  LocalVisionThresholds,
  VisionCandidate,
} from '../types'
import { normalizePhrase } from '../voice/localCommands'

export const defaultLocalVisionThresholds: LocalVisionThresholds = {
  sceneConfidence: 0.82,
  objectConfidence: 0.85,
  gestureConfidence: 0.8,
}

export interface MockLocalVisionAnalyzerOptions {
  thresholds?: Partial<LocalVisionThresholds>
  sceneCandidates?: VisionCandidate[]
  objectCandidates?: VisionCandidate[]
  gestures?: GestureDetection[]
}

export class MockLocalVisionAnalyzer implements LocalVisionAnalyzer {
  private readonly thresholds: LocalVisionThresholds
  private readonly configuredScenes: VisionCandidate[]
  private readonly configuredObjects: VisionCandidate[]
  private readonly configuredGestures: GestureDetection[]

  constructor({
    thresholds,
    sceneCandidates = defaultSceneCandidates,
    objectCandidates = defaultObjectCandidates,
    gestures = defaultGestures,
  }: MockLocalVisionAnalyzerOptions = {}) {
    this.thresholds = { ...defaultLocalVisionThresholds, ...thresholds }
    this.configuredScenes = sceneCandidates
    this.configuredObjects = objectCandidates
    this.configuredGestures = gestures
  }

  async analyze({ frame, transcript, language }: LocalVisionAnalysisInput): Promise<LocalVisionSignals> {
    const normalized = normalizePhrase(transcript)
    const hasFrame = Boolean(frame)
    const sceneCandidates = hasFrame && isSceneQuestion(normalized) ? this.configuredScenes : []
    const objectCandidates = hasFrame && isObjectQuestion(normalized) ? this.configuredObjects : []
    const gestures = hasFrame ? filterGestures(this.configuredGestures, normalized, language) : []

    return {
      sceneCandidates,
      objectCandidates,
      gestures,
      analyzedAt: Date.now(),
      shouldUseCloud:
        isVisualQuestion(normalized) &&
        !hasConfidentCandidate(sceneCandidates, this.thresholds.sceneConfidence) &&
        !hasConfidentCandidate(objectCandidates, this.thresholds.objectConfidence) &&
        !hasConfidentGesture(gestures, this.thresholds.gestureConfidence),
    }
  }
}

export function hasConfidentCandidate(candidates: VisionCandidate[], threshold: number): boolean {
  return Boolean(getTopCandidate(candidates, threshold))
}

export function getTopCandidate(
  candidates: VisionCandidate[],
  threshold = 0,
): VisionCandidate | null {
  return (
    candidates
      .filter((candidate) => candidate.confidence >= threshold)
      .sort((left, right) => right.confidence - left.confidence)[0] ?? null
  )
}

export function hasConfidentGesture(gestures: GestureDetection[], threshold: number): boolean {
  return gestures.some((gesture) => gesture.confidence >= threshold)
}

export function getTopGesture(
  gestures: GestureDetection[],
  threshold = defaultLocalVisionThresholds.gestureConfidence,
): GestureDetection | null {
  return gestures
    .filter((gesture) => gesture.confidence >= threshold)
    .sort((left, right) => right.confidence - left.confidence)[0] ?? null
}

export function isObjectQuestion(normalizedTranscript: string): boolean {
  return ['这是什么', '这个是什么', 'what is this', 'whats this', 'what is it'].some((phrase) =>
    normalizedTranscript.includes(phrase),
  )
}

export function isSceneQuestion(normalizedTranscript: string): boolean {
  return [
    '我现在在哪类场景',
    '我在哪类场景',
    '这是什么场景',
    'where am i',
    'what scene',
    'what kind of place',
  ].some((phrase) => normalizedTranscript.includes(phrase))
}

export function isFollowUpQuestion(normalizedTranscript: string): boolean {
  return ['它', '这个', 'it', 'that object'].some((phrase) => normalizedTranscript.includes(phrase))
}

export function isVisualQuestion(normalizedTranscript: string): boolean {
  return (
    isObjectQuestion(normalizedTranscript) ||
    isSceneQuestion(normalizedTranscript) ||
    isFollowUpQuestion(normalizedTranscript) ||
    ['看', '画面', 'camera', 'video', 'see'].some((phrase) => normalizedTranscript.includes(phrase))
  )
}

function filterGestures(
  gestures: GestureDetection[],
  normalizedTranscript: string,
  language: AppLanguage,
): GestureDetection[] {
  if (normalizedTranscript.includes('nod') || normalizedTranscript.includes('点头')) {
    return localizeGestures(
      gestures.filter((gesture) => gesture.type === 'nod'),
      language,
    )
  }

  if (
    normalizedTranscript.includes('举手') ||
    normalizedTranscript.includes('raise') ||
    normalizedTranscript.includes('hand')
  ) {
    return localizeGestures(
      gestures.filter((gesture) => gesture.type === 'raised-hand'),
      language,
    )
  }

  return []
}

function localizeGestures(gestures: GestureDetection[], language: AppLanguage): GestureDetection[] {
  return gestures.map((gesture) => ({
    ...gesture,
    spokenResponse: localizeGestureResponse(gesture.type, language),
  }))
}

function localizeGestureResponse(type: GestureDetection['type'], language: AppLanguage): string {
  if (type === 'raised-hand') {
    return language === 'zh' ? '你举手了' : 'You raised your hand.'
  }

  return language === 'zh' ? '你点头了' : 'You nodded.'
}

const defaultSceneCandidates: VisionCandidate[] = [
  {
    label: 'kitchen',
    confidence: 0.9,
    region: { x: 0.05, y: 0.05, width: 0.9, height: 0.9, label: 'scene' },
  },
]

const defaultObjectCandidates: VisionCandidate[] = [
  {
    label: 'cup',
    confidence: 0.9,
    region: { x: 0.32, y: 0.28, width: 0.26, height: 0.36, label: 'cup' },
  },
]

const defaultGestures: GestureDetection[] = [
  {
    type: 'raised-hand',
    label: 'raised hand',
    confidence: 0.86,
    spokenResponse: '你举手了',
  },
  {
    type: 'nod',
    label: 'nod',
    confidence: 0.84,
    spokenResponse: '你点头了',
  },
]
