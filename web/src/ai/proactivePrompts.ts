import type {
  AppLanguage,
  ProactiveDetectionResult,
  ProactiveDetectorSignal,
  ProactiveDetectorStatus,
  ProactiveLocalDetector,
  ProactiveOcrSignal,
  ProactivePromptCandidate,
  ProactivePromptCounters,
  ProactivePromptFeedback,
  ProactivePromptPriority,
  ProactivePromptSeverity,
  ProactivePromptSettings,
  ProactivePromptSource,
  ProactivePromptState,
  ProactiveRuleMatch,
  ProactiveReminderIntensity,
  SampledVideoFrame,
  VisionRegion,
} from '../types'

const STORAGE_KEY = 'proactive-prompt-state-v1'
const DEFAULT_DAILY_CAP = 20
const MORE_REMINDERS_DAILY_CAP = 40
const DEFAULT_HISTORY_WINDOW_MS = 30_000
const MIN_PROMPT_CONFIDENCE = 0.9
const DUPLICATE_COOLDOWN_MS = 30_000
const SESSION_RATE_WINDOW_MS = 60_000

interface StoredProactivePromptState {
  settings?: Partial<ProactivePromptSettings>
  counters?: Partial<ProactivePromptCounters>
  feedback?: ProactivePromptFeedback[]
}

export interface MockProactiveLocalDetectorOptions {
  status?: ProactiveDetectorStatus
  source?: ProactiveDetectionResult['source']
  signals?: Array<Omit<ProactiveDetectorSignal, 'detectedAt'> & { detectedAt?: number }>
  errorMessage?: string
}

export interface TensorFlowJsProactiveModel {
  detect: (frame: SampledVideoFrame) => Promise<Array<Omit<ProactiveDetectorSignal, 'detectedAt'> & { detectedAt?: number }>>
}

export interface TensorFlowJsProactiveDetectorOptions {
  loadModel: () => Promise<TensorFlowJsProactiveModel>
}

export interface ProactiveRuleContext {
  detection: ProactiveDetectionResult
  history: ProactiveObservationHistory
  language: AppLanguage
  now: number
  state?: ProactivePromptState
}

export interface ProactivePromptRule {
  id: string
  promptKey: string
  severity: ProactivePromptSeverity
  priority: ProactivePromptPriority
  source: ProactivePromptSource
  evaluate: (context: ProactiveRuleContext) => ProactiveRuleMatch | null
}

export interface ProactivePromptPolicyInput {
  match: ProactiveRuleMatch
  state: ProactivePromptState
  now?: number
  userSpeaking?: boolean
}

export interface ProactivePromptPolicyResult {
  accepted: boolean
  candidate?: ProactivePromptCandidate
  reason?:
    | 'disabled'
    | 'low-confidence'
    | 'duplicate'
    | 'session-rate'
    | 'daily-cap'
    | 'sensitive-ocr'
    | 'user-speaking'
}

export class MockProactiveLocalDetector implements ProactiveLocalDetector {
  private readonly status: ProactiveDetectorStatus
  private readonly source: ProactiveDetectionResult['source']
  private readonly signals: NonNullable<MockProactiveLocalDetectorOptions['signals']>
  private readonly errorMessage?: string

  constructor({
    status = 'ready',
    source = 'mock',
    signals = defaultMockDetectorSignals,
    errorMessage,
  }: MockProactiveLocalDetectorOptions = {}) {
    this.status = status
    this.source = source
    this.signals = signals ?? defaultMockDetectorSignals
    this.errorMessage = errorMessage
  }

  getStatus(): ProactiveDetectorStatus {
    return this.status
  }

  async detect(_frame: SampledVideoFrame | null, now = Date.now()): Promise<ProactiveDetectionResult> {
    return {
      status: this.status,
      capturedAt: now,
      signals: this.status === 'ready' ? this.signals.map((signal) => normalizeSignal(signal, now)) : [],
      errorMessage: this.errorMessage,
      source: this.source,
    }
  }
}

export class TensorFlowJsProactiveDetector implements ProactiveLocalDetector {
  private status: ProactiveDetectorStatus = 'idle'
  private model: TensorFlowJsProactiveModel | null = null
  private errorMessage: string | undefined
  private readonly loadModel: () => Promise<TensorFlowJsProactiveModel>

  constructor({ loadModel }: TensorFlowJsProactiveDetectorOptions) {
    this.loadModel = loadModel
  }

  getStatus(): ProactiveDetectorStatus {
    return this.status
  }

  async detect(frame: SampledVideoFrame | null, now = Date.now()): Promise<ProactiveDetectionResult> {
    if (!frame) {
      return {
        status: this.status,
        capturedAt: now,
        signals: [],
        errorMessage: this.errorMessage,
        source: 'tensorflow-js',
      }
    }

    try {
      const model = await this.getModel()
      const signals = await model.detect(frame)
      return {
        status: 'ready',
        capturedAt: now,
        signals: signals.map((signal) => normalizeSignal(signal, now)),
        source: 'tensorflow-js',
      }
    } catch (error) {
      this.status = 'failed'
      this.errorMessage = error instanceof Error ? error.message : 'TensorFlow.js detector unavailable.'
      return {
        status: this.status,
        capturedAt: now,
        signals: [],
        errorMessage: this.errorMessage,
        source: 'tensorflow-js',
      }
    }
  }

  private async getModel(): Promise<TensorFlowJsProactiveModel> {
    if (this.model) {
      return this.model
    }

    this.status = 'loading'
    this.model = await this.loadModel()
    this.status = 'ready'
    return this.model
  }
}

export class ProactiveObservationHistory {
  private readonly windowMs: number
  private results: ProactiveDetectionResult[] = []

  constructor(windowMs = DEFAULT_HISTORY_WINDOW_MS) {
    this.windowMs = windowMs
  }

  add(result: ProactiveDetectionResult): void {
    this.results = [...this.results, result].filter(
      (entry) => result.capturedAt - entry.capturedAt <= this.windowMs,
    )
  }

  getRecent(now = Date.now()): ProactiveDetectionResult[] {
    return this.results.filter((entry) => now - entry.capturedAt <= this.windowMs)
  }

  hasCurrentLabel(label: string, threshold = 0): boolean {
    const latest = this.results[this.results.length - 1]
    return Boolean(latest?.signals.some((signal) => matchesLabel(signal, label) && signal.confidence >= threshold))
  }

  wasLabelSeen(label: string, now = Date.now(), threshold = 0): boolean {
    return this.getRecent(now).some((result) =>
      result.signals.some((signal) => matchesLabel(signal, label) && signal.confidence >= threshold),
    )
  }

  didLabelLeaveView(label: string, now = Date.now(), threshold = 0): boolean {
    return this.wasLabelSeen(label, now, threshold) && !this.hasCurrentLabel(label, threshold)
  }

  clear(): void {
    this.results = []
  }
}

export class ProactiveRulesEngine {
  private readonly rules: ProactivePromptRule[]

  constructor(rules: ProactivePromptRule[] = createDefaultProactiveRules()) {
    this.rules = rules
  }

  evaluate(context: ProactiveRuleContext): ProactiveRuleMatch[] {
    return this.rules
      .map((rule) => rule.evaluate(context))
      .filter((match): match is ProactiveRuleMatch => Boolean(match))
      .map((match) => applyFeedbackPenalty(match, context))
  }
}

export function createDefaultProactivePromptSettings(
  intensity: ProactiveReminderIntensity = 'normal',
): ProactivePromptSettings {
  return {
    enabled: true,
    reminderIntensity: intensity,
    dailyCap: intensity === 'more' ? MORE_REMINDERS_DAILY_CAP : DEFAULT_DAILY_CAP,
  }
}

export function createDefaultProactivePromptCounters(now = Date.now()): ProactivePromptCounters {
  return {
    date: formatCounterDate(now),
    dailyCount: 0,
    sessionStartedAt: now,
    spokenAt: [],
    lastPromptAtByKey: {},
  }
}

export function createDefaultProactivePromptState(now = Date.now()): ProactivePromptState {
  return {
    settings: createDefaultProactivePromptSettings(),
    counters: createDefaultProactivePromptCounters(now),
    feedback: [],
    storageAvailable: true,
  }
}

export function loadProactivePromptState(
  storage: Storage | null | undefined = getBrowserStorage(),
  now = Date.now(),
): ProactivePromptState {
  const fallback = createDefaultProactivePromptState(now)
  if (!storage) {
    return { ...fallback, storageAvailable: false }
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    return normalizeStoredState(JSON.parse(raw) as StoredProactivePromptState, now)
  } catch {
    return { ...fallback, storageAvailable: false }
  }
}

export function saveProactivePromptState(
  state: ProactivePromptState,
  storage: Storage | null | undefined = getBrowserStorage(),
): ProactivePromptState {
  if (!storage) {
    return { ...state, storageAvailable: false }
  }

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: state.settings,
        counters: state.counters,
        feedback: state.feedback,
      }),
    )
    return { ...state, storageAvailable: true }
  } catch {
    return { ...state, storageAvailable: false }
  }
}

export function setProactivePromptsEnabled(
  state: ProactivePromptState,
  enabled: boolean,
): ProactivePromptState {
  return {
    ...state,
    settings: {
      ...state.settings,
      enabled,
    },
  }
}

export function setProactiveReminderIntensity(
  state: ProactivePromptState,
  reminderIntensity: ProactiveReminderIntensity,
): ProactivePromptState {
  return {
    ...state,
    settings: {
      ...state.settings,
      enabled: true,
      reminderIntensity,
      dailyCap:
        reminderIntensity === 'more'
          ? Math.max(state.settings.dailyCap, MORE_REMINDERS_DAILY_CAP)
          : state.settings.dailyCap,
    },
  }
}

export function recordProactivePromptSpoken(
  state: ProactivePromptState,
  promptKey: string,
  now = Date.now(),
): ProactivePromptState {
  const counters = resetCountersIfNewDay(state.counters, now)
  return {
    ...state,
    counters: {
      ...counters,
      dailyCount: counters.dailyCount + 1,
      spokenAt: [...counters.spokenAt, now],
      lastPromptAtByKey: {
        ...counters.lastPromptAtByKey,
        [promptKey]: now,
      },
    },
  }
}

export function recordProactivePromptFeedback(
  state: ProactivePromptState,
  feedback: Omit<ProactivePromptFeedback, 'createdAt' | 'penalty'> & {
    createdAt?: number
    penalty?: number
  },
): ProactivePromptState {
  return {
    ...state,
    feedback: [
      ...state.feedback,
      {
        ...feedback,
        createdAt: feedback.createdAt ?? Date.now(),
        penalty: feedback.penalty ?? 0.05,
      },
    ],
  }
}

export function resetCountersIfNewDay(
  counters: ProactivePromptCounters,
  now = Date.now(),
): ProactivePromptCounters {
  const date = formatCounterDate(now)
  if (counters.date === date) {
    return counters
  }

  return {
    ...createDefaultProactivePromptCounters(now),
    sessionStartedAt: counters.sessionStartedAt,
  }
}

export function evaluateProactivePromptPolicy({
  match,
  state,
  now = Date.now(),
  userSpeaking = false,
}: ProactivePromptPolicyInput): ProactivePromptPolicyResult {
  const counters = resetCountersIfNewDay(state.counters, now)
  if (!state.settings.enabled) {
    return { accepted: false, reason: 'disabled' }
  }

  if (match.confidence <= MIN_PROMPT_CONFIDENCE) {
    return { accepted: false, reason: 'low-confidence' }
  }

  const lastPromptAt = counters.lastPromptAtByKey[match.promptKey]
  if (lastPromptAt !== undefined && now - lastPromptAt < DUPLICATE_COOLDOWN_MS) {
    return { accepted: false, reason: 'duplicate' }
  }

  if (counters.dailyCount >= state.settings.dailyCap && match.priority !== 'urgent') {
    return { accepted: false, reason: 'daily-cap' }
  }

  const sessionElapsedMs = Math.max(1, now - counters.sessionStartedAt)
  const allowedPrompts = Math.max(1, Math.floor(sessionElapsedMs / SESSION_RATE_WINDOW_MS))
  if (counters.spokenAt.length >= allowedPrompts && match.priority !== 'urgent') {
    return { accepted: false, reason: 'session-rate' }
  }

  if (userSpeaking && match.priority !== 'urgent') {
    return { accepted: false, reason: 'user-speaking' }
  }

  return {
    accepted: true,
    candidate: {
      id: `${match.ruleId}-${now}`,
      ruleId: match.ruleId,
      promptKey: match.promptKey,
      text: ensureUncertaintyWording(match.message, match.severity),
      confidence: match.confidence,
      severity: match.severity,
      priority: match.priority,
      source: match.source,
      labels: match.labels,
      regions: match.regions,
      createdAt: now,
    },
  }
}

export function filterSensitiveOcrMatch(
  match: ProactiveRuleMatch,
  detection: ProactiveDetectionResult,
): ProactiveRuleMatch | null {
  const hasSensitiveOcr = detection.signals.some(
    (signal) => signal.kind === 'ocr' && signal.ocr?.hasContinuousDigits,
  )
  if (!hasSensitiveOcr) {
    return match
  }

  return match.requiresSensitiveSpeech ? null : { ...match, labels: [...new Set([...match.labels, 'sensitive-ocr'])] }
}

export function ensureUncertaintyWording(message: string, severity: ProactivePromptSeverity): string {
  if (message.includes('似乎') || message.includes('可能需要') || message.includes('seems') || message.includes('may')) {
    return message
  }

  if (severity === 'safety') {
    return `似乎${message}`
  }

  return `似乎${message}，可能需要留意一下`
}

export function createDefaultProactiveRules(): ProactivePromptRule[] {
  return [
    createLabelLeaveRule({
      id: 'left-behind-phone',
      promptKey: 'phone-left-view',
      label: 'phone',
      message: '手机不在画面里了，可能需要留意一下',
      severity: 'reminder',
      priority: 'normal',
    }),
    createSignalRule({
      id: 'unattended-stove-flame',
      promptKey: 'unattended-stove-flame',
      requiredLabels: ['stove-flame'],
      absentLabels: ['person'],
      message: '灶台火还开着，似乎无人看管',
      severity: 'safety',
      priority: 'urgent',
    }),
    createSignalRule({
      id: 'risky-scissor-use',
      promptKey: 'risky-scissor-use',
      requiredLabels: ['scissors', 'finger-near-blade'],
      message: '使用剪刀时可能需要小心手指',
      severity: 'safety',
      priority: 'urgent',
    }),
    createSignalRule({
      id: 'delivery-person-at-door',
      promptKey: 'delivery-person-at-door',
      requiredLabels: ['delivery-person'],
      message: '快递员似乎在门口',
      severity: 'info',
      priority: 'normal',
    }),
    createSignalRule({
      id: 'useful-reminder',
      promptKey: 'useful-reminder',
      requiredLabels: ['reminder-event'],
      message: '画面里似乎有一件可能需要处理的事情',
      severity: 'reminder',
      priority: 'normal',
    }),
  ]
}

export function getLocalProactivePromptRatio(candidates: ProactivePromptCandidate[]): number {
  if (candidates.length === 0) {
    return 1
  }

  const localCount = candidates.filter(
    (candidate) => candidate.source === 'local-rules' || candidate.source === 'edge-detection',
  ).length
  return localCount / candidates.length
}

export function formatCounterDate(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

export function normalizeSignal(
  signal: Omit<ProactiveDetectorSignal, 'detectedAt'> & { detectedAt?: number },
  now = Date.now(),
): ProactiveDetectorSignal {
  return {
    ...signal,
    confidence: clampConfidence(signal.confidence),
    detectedAt: signal.detectedAt ?? now,
    ocr: signal.ocr ? normalizeOcrSignal(signal.ocr) : undefined,
  }
}

export function hasContinuousDigits(text: string): boolean {
  return /\d{3,}/.test(text)
}

function normalizeOcrSignal(signal: ProactiveOcrSignal): ProactiveOcrSignal {
  return {
    ...signal,
    hasContinuousDigits: signal.hasContinuousDigits || hasContinuousDigits(signal.text),
  }
}

function createLabelLeaveRule({
  id,
  promptKey,
  label,
  message,
  severity,
  priority,
}: {
  id: string
  promptKey: string
  label: string
  message: string
  severity: ProactivePromptSeverity
  priority: ProactivePromptPriority
}): ProactivePromptRule {
  return {
    id,
    promptKey,
    severity,
    priority,
    source: 'local-rules',
    evaluate: ({ detection, history, now }) => {
      if (!history.didLabelLeaveView(label, now, MIN_PROMPT_CONFIDENCE)) {
        return null
      }

      return {
        ruleId: id,
        promptKey,
        message,
        confidence: MIN_PROMPT_CONFIDENCE + 0.01,
        severity,
        priority,
        source: 'local-rules',
        labels: [label],
        regions: findRegions(detection.signals, label),
        matchedAt: now,
      }
    },
  }
}

function createSignalRule({
  id,
  promptKey,
  requiredLabels,
  absentLabels = [],
  message,
  severity,
  priority,
}: {
  id: string
  promptKey: string
  requiredLabels: string[]
  absentLabels?: string[]
  message: string
  severity: ProactivePromptSeverity
  priority: ProactivePromptPriority
}): ProactivePromptRule {
  return {
    id,
    promptKey,
    severity,
    priority,
    source: 'local-rules',
    evaluate: ({ detection, now }) => {
      const requiredSignals = requiredLabels.map((label) => findSignal(detection.signals, label))
      if (requiredSignals.some((signal) => !signal || signal.confidence <= MIN_PROMPT_CONFIDENCE)) {
        return null
      }

      if (absentLabels.some((label) => findSignal(detection.signals, label))) {
        return null
      }

      const confidence = Math.min(...requiredSignals.map((signal) => signal?.confidence ?? 0))
      return filterSensitiveOcrMatch(
        {
          ruleId: id,
          promptKey,
          message,
          confidence,
          severity,
          priority,
          source: 'local-rules',
          labels: requiredLabels,
          regions: requiredSignals.flatMap((signal) => (signal?.region ? [signal.region] : [])),
          matchedAt: now,
        },
        detection,
      )
    },
  }
}

function applyFeedbackPenalty(match: ProactiveRuleMatch, context: ProactiveRuleContext): ProactiveRuleMatch {
  return {
    ...match,
    confidence: Math.max(0, match.confidence - getFeedbackPenalty(context, match)),
  }
}

function getFeedbackPenalty(context: ProactiveRuleContext, match: ProactiveRuleMatch): number {
  if (!context.state) {
    return 0
  }

  return context.state.feedback
    .filter((feedback) => feedback.ruleId === match.ruleId || feedback.promptKey === match.promptKey)
    .filter((feedback) => feedback.labels.some((label) => match.labels.includes(label)))
    .reduce((total, feedback) => total + feedback.penalty, 0)
}

function findSignal(signals: ProactiveDetectorSignal[], label: string): ProactiveDetectorSignal | undefined {
  return signals.find((signal) => matchesLabel(signal, label))
}

function findRegions(signals: ProactiveDetectorSignal[], label: string): VisionRegion[] {
  return signals.filter((signal) => matchesLabel(signal, label) && signal.region).map((signal) => signal.region!)
}

function normalizeStoredState(
  stored: StoredProactivePromptState,
  now: number,
): ProactivePromptState {
  const settings = normalizeSettings(stored.settings)
  return {
    settings,
    counters: normalizeCounters(stored.counters, now),
    feedback: Array.isArray(stored.feedback) ? stored.feedback : [],
    storageAvailable: true,
  }
}

function normalizeSettings(settings: Partial<ProactivePromptSettings> = {}): ProactivePromptSettings {
  const reminderIntensity = settings.reminderIntensity === 'more' ? 'more' : 'normal'
  return {
    enabled: settings.enabled ?? true,
    reminderIntensity,
    dailyCap:
      typeof settings.dailyCap === 'number' && settings.dailyCap > 0
        ? settings.dailyCap
        : createDefaultProactivePromptSettings(reminderIntensity).dailyCap,
  }
}

function normalizeCounters(
  counters: Partial<ProactivePromptCounters> = {},
  now: number,
): ProactivePromptCounters {
  const defaults = createDefaultProactivePromptCounters(now)
  const normalized = {
    date: typeof counters.date === 'string' ? counters.date : defaults.date,
    dailyCount: typeof counters.dailyCount === 'number' ? counters.dailyCount : defaults.dailyCount,
    sessionStartedAt:
      typeof counters.sessionStartedAt === 'number'
        ? counters.sessionStartedAt
        : defaults.sessionStartedAt,
    spokenAt: Array.isArray(counters.spokenAt) ? counters.spokenAt : defaults.spokenAt,
    lastPromptAtByKey:
      counters.lastPromptAtByKey && typeof counters.lastPromptAtByKey === 'object'
        ? counters.lastPromptAtByKey
        : defaults.lastPromptAtByKey,
  }

  return resetCountersIfNewDay(normalized, now)
}

function getBrowserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

function matchesLabel(signal: ProactiveDetectorSignal, label: string): boolean {
  return signal.label.toLocaleLowerCase() === label.toLocaleLowerCase()
}

function clampConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence))
}

function region(label: string, x: number, y: number): VisionRegion {
  return { label, x, y, width: 0.2, height: 0.2 }
}

const defaultMockDetectorSignals: NonNullable<MockProactiveLocalDetectorOptions['signals']> = [
  {
    id: 'phone-1',
    kind: 'object',
    label: 'phone',
    confidence: 0.94,
    region: region('phone', 0.25, 0.55),
    trackId: 'phone-track',
  },
  {
    id: 'flame-1',
    kind: 'object',
    label: 'stove-flame',
    confidence: 0.95,
    region: region('stove-flame', 0.6, 0.4),
  },
  {
    id: 'scissors-1',
    kind: 'object',
    label: 'scissors',
    confidence: 0.93,
    region: region('scissors', 0.45, 0.5),
  },
  {
    id: 'finger-1',
    kind: 'action',
    label: 'finger-near-blade',
    confidence: 0.92,
    region: region('finger-near-blade', 0.5, 0.5),
  },
  {
    id: 'delivery-1',
    kind: 'person',
    label: 'delivery-person',
    confidence: 0.94,
    region: region('delivery-person', 0.35, 0.2),
  },
  {
    id: 'ocr-1',
    kind: 'ocr',
    label: 'ocr-text',
    confidence: 0.96,
    region: region('ocr-text', 0.1, 0.1),
    ocr: {
      text: '123456',
      hasContinuousDigits: true,
    },
  },
]
