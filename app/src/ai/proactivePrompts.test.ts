import { describe, expect, it } from 'vitest'
import {
  createDefaultProactivePromptState,
  createDefaultProactiveRules,
  evaluateProactivePromptPolicy,
  filterSensitiveOcrMatch,
  createProactiveLocalDetector,
  MockProactiveLocalDetector,
  ProactiveObservationHistory,
  ProactiveRulesEngine,
  TensorFlowJsProactiveDetector,
  getLocalProactivePromptRatio,
  loadProactivePromptState,
  normalizeSignal,
  recordProactivePromptFeedback,
  recordProactivePromptSpoken,
  saveProactivePromptState,
  setProactivePromptsEnabled,
  setProactiveReminderIntensity,
} from './proactivePrompts'
import type { ProactiveDetectionResult, ProactiveRuleMatch, SampledVideoFrame } from '../types'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error('storage unavailable')
  }

  override setItem(): void {
    throw new Error('storage unavailable')
  }
}

describe('proactive prompt settings persistence', () => {
  it('creates conservative default settings and counters', () => {
    const state = createDefaultProactivePromptState(Date.UTC(2026, 5, 13))

    expect(state.settings).toEqual({
      enabled: true,
      reminderIntensity: 'normal',
      dailyCap: 20,
    })
    expect(state.counters.date).toBe('2026-06-13')
    expect(state.counters.dailyCount).toBe(0)
    expect(state.storageAvailable).toBe(true)
  })

  it('persists and restores settings, counters, and feedback', () => {
    const storage = new MemoryStorage()
    const now = Date.UTC(2026, 5, 13, 8)
    const state = recordProactivePromptFeedback(
      recordProactivePromptSpoken(
        setProactiveReminderIntensity(
          setProactivePromptsEnabled(createDefaultProactivePromptState(now), false),
          'more',
        ),
        'phone-left-view',
        now + 1_000,
      ),
      {
        ruleId: 'left-behind-phone',
        promptKey: 'phone-left-view',
        labels: ['phone'],
        createdAt: now + 2_000,
      },
    )

    saveProactivePromptState(state, storage)
    const restored = loadProactivePromptState(storage, now + 3_000)

    expect(restored.settings.enabled).toBe(true)
    expect(restored.settings.reminderIntensity).toBe('more')
    expect(restored.settings.dailyCap).toBe(40)
    expect(restored.counters.dailyCount).toBe(1)
    expect(restored.counters.lastPromptAtByKey['phone-left-view']).toBe(now + 1_000)
    expect(restored.feedback[0]?.ruleId).toBe('left-behind-phone')
  })

  it('resets daily counters when loading on a new date', () => {
    const storage = new MemoryStorage()
    const dayOne = Date.UTC(2026, 5, 13, 23)
    const dayTwo = Date.UTC(2026, 5, 14, 1)

    saveProactivePromptState(
      recordProactivePromptSpoken(createDefaultProactivePromptState(dayOne), 'delivery-at-door', dayOne),
      storage,
    )

    const restored = loadProactivePromptState(storage, dayTwo)

    expect(restored.counters.date).toBe('2026-06-14')
    expect(restored.counters.dailyCount).toBe(0)
    expect(restored.counters.spokenAt).toEqual([])
  })

  it('falls back when storage is unavailable', () => {
    const state = loadProactivePromptState(new ThrowingStorage(), Date.UTC(2026, 5, 13))
    const saved = saveProactivePromptState(state, new ThrowingStorage())

    expect(state.storageAvailable).toBe(false)
    expect(saved.storageAvailable).toBe(false)
    expect(state.settings.enabled).toBe(true)
  })
})

describe('proactive prompt local detection', () => {
  it('normalizes confidence and OCR digit metadata', () => {
    const signal = normalizeSignal(
      {
        id: 'ocr',
        kind: 'ocr',
        label: 'ocr-text',
        confidence: 2,
        ocr: {
          text: 'code 123456',
          hasContinuousDigits: false,
        },
      },
      10,
    )

    expect(signal.confidence).toBe(1)
    expect(signal.detectedAt).toBe(10)
    expect(signal.ocr?.hasContinuousDigits).toBe(true)
  })

  it('returns mock detector signals for proactive development scenarios', async () => {
    const result = await new MockProactiveLocalDetector().detect(frame, 20)

    expect(result.status).toBe('ready')
    expect(result.signals.map((signal) => signal.label)).toEqual(
      expect.arrayContaining(['phone', 'stove-flame', 'scissors', 'delivery-person', 'ocr-text']),
    )
    expect(result.signals.every((signal) => signal.detectedAt === 20)).toBe(true)
  })

  it('creates a production detector without demo safety signals by default', async () => {
    const result = await createProactiveLocalDetector().detect(frame, 25)

    expect(result.signals).toEqual([])
  })

  it('handles TensorFlow.js model load failure without throwing', async () => {
    const detector = new TensorFlowJsProactiveDetector({
      loadModel: async () => {
        throw new Error('missing model')
      },
    })

    const result = await detector.detect(frame, 30)

    expect(result.status).toBe('failed')
    expect(result.signals).toEqual([])
    expect(result.errorMessage).toBe('missing model')
  })

  it('tracks whether an object left the camera view', () => {
    const history = new ProactiveObservationHistory(10_000)
    history.add({
      status: 'ready',
      capturedAt: 100,
      source: 'mock',
      signals: [
        normalizeSignal({
          id: 'phone-1',
          kind: 'object',
          label: 'phone',
          confidence: 0.95,
        }),
      ],
    })
    history.add({
      status: 'ready',
      capturedAt: 200,
      source: 'mock',
      signals: [],
    })

    expect(history.didLabelLeaveView('phone', 200, 0.9)).toBe(true)
    expect(history.didLabelLeaveView('keys', 200, 0.9)).toBe(false)
  })
})

describe('proactive prompt rules and policy', () => {
  it('matches default rules for safety and useful events', async () => {
    const detection = await new MockProactiveLocalDetector().detect(frame, 1_000)
    const history = new ProactiveObservationHistory()
    history.add(detection)
    const matches = new ProactiveRulesEngine().evaluate({
      detection,
      history,
      language: 'zh',
      now: 1_000,
    })

    expect(matches.map((match) => match.ruleId)).toEqual(
      expect.arrayContaining(['unattended-stove-flame', 'risky-scissor-use', 'delivery-person-at-door']),
    )
    expect(matches.find((match) => match.ruleId === 'unattended-stove-flame')?.priority).toBe('urgent')
  })

  it('detects a phone leaving the camera view from observation history', () => {
    const history = new ProactiveObservationHistory()
    history.add(detectionWithLabels(['phone'], 1_000))
    const detection = detectionWithLabels([], 2_000)
    history.add(detection)

    const matches = new ProactiveRulesEngine(createDefaultProactiveRules()).evaluate({
      detection,
      history,
      language: 'zh',
      now: 2_000,
    })

    expect(matches.find((match) => match.ruleId === 'left-behind-phone')?.promptKey).toBe('phone-left-view')
  })

  it('enforces confidence, duplicate, daily, session, disabled, and user-speaking gates', () => {
    const now = 60_000
    const match = createMatch({ confidence: 0.95, priority: 'normal', matchedAt: now })
    const state = createDefaultProactivePromptState(0)

    expect(evaluateProactivePromptPolicy({ match, state, now }).accepted).toBe(true)
    expect(
      evaluateProactivePromptPolicy({
        match: createMatch({ confidence: 0.9 }),
        state,
        now,
      }).reason,
    ).toBe('low-confidence')
    expect(
      evaluateProactivePromptPolicy({
        match,
        state: setProactivePromptsEnabled(state, false),
        now,
      }).reason,
    ).toBe('disabled')
    expect(
      evaluateProactivePromptPolicy({
        match,
        state: recordProactivePromptSpoken(state, match.promptKey, now - 1_000),
        now,
      }).reason,
    ).toBe('duplicate')
    expect(
      evaluateProactivePromptPolicy({
        match,
        state: { ...state, counters: { ...state.counters, spokenAt: [10_000] } },
        now,
      }).reason,
    ).toBe('session-rate')
    expect(
      evaluateProactivePromptPolicy({
        match,
        state: { ...state, settings: { ...state.settings, dailyCap: 0 } },
        now,
      }).reason,
    ).toBe('daily-cap')
    expect(evaluateProactivePromptPolicy({ match, state, now, userSpeaking: true }).reason).toBe('user-speaking')
  })

  it('allows urgent prompts to bypass user speaking and rate caps', () => {
    const state = {
      ...createDefaultProactivePromptState(0),
      settings: { enabled: true, reminderIntensity: 'normal' as const, dailyCap: 0 },
      counters: { ...createDefaultProactivePromptState(0).counters, spokenAt: [10_000] },
    }

    const result = evaluateProactivePromptPolicy({
      match: createMatch({ priority: 'urgent', severity: 'safety', message: '灶台火还开着' }),
      state,
      now: 60_000,
      userSpeaking: true,
    })

    expect(result.accepted).toBe(true)
    expect(result.candidate?.text).toContain('似乎')
  })

  it('keeps urgent safety prompts on a longer duplicate cooldown', () => {
    const state = createDefaultProactivePromptState(0)
    const match = createMatch({ priority: 'urgent', severity: 'safety', promptKey: 'risky-scissor-use' })

    expect(
      evaluateProactivePromptPolicy({
        match,
        state: recordProactivePromptSpoken(state, match.promptKey, 60_000),
        now: 120_000,
      }).reason,
    ).toBe('duplicate')

    expect(
      evaluateProactivePromptPolicy({
        match,
        state: recordProactivePromptSpoken(state, match.promptKey, 60_000),
        now: 360_000,
      }).accepted,
    ).toBe(true)
  })

  it('applies correction feedback as a confidence penalty', () => {
    const detection = detectionWithLabels(['delivery-person'], 1_000)
    const state = recordProactivePromptFeedback(createDefaultProactivePromptState(0), {
      ruleId: 'delivery-person-at-door',
      promptKey: 'delivery-person-at-door',
      labels: ['delivery-person'],
      penalty: 0.1,
      createdAt: 900,
    })

    const matches = new ProactiveRulesEngine().evaluate({
      detection,
      history: new ProactiveObservationHistory(),
      language: 'zh',
      now: 1_000,
      state,
    })

    expect(matches.find((match) => match.ruleId === 'delivery-person-at-door')?.confidence).toBeCloseTo(0.85)
  })

  it('reports local proactive prompt attribution ratio', () => {
    const local = evaluateProactivePromptPolicy({
      match: createMatch({ source: 'local-rules' }),
      state: createDefaultProactivePromptState(0),
      now: 60_000,
    }).candidate!
    const cloud = { ...local, id: 'cloud', source: 'cloud' as const }

    expect(getLocalProactivePromptRatio([local, cloud])).toBe(0.5)
  })

  it('suppresses prompts that require speaking sensitive OCR strings', () => {
    const detection = detectionWithLabels(['ocr-text'], 1_000)
    detection.signals[0] = {
      ...detection.signals[0],
      kind: 'ocr',
      ocr: { text: '123456', hasContinuousDigits: true },
    }

    expect(
      filterSensitiveOcrMatch(
        {
          ...createMatch(),
          requiresSensitiveSpeech: true,
        },
        detection,
      ),
    ).toBeNull()
    expect(filterSensitiveOcrMatch(createMatch(), detection)?.labels).toContain('sensitive-ocr')
  })
})

function detectionWithLabels(labels: string[], capturedAt: number): ProactiveDetectionResult {
  return {
    status: 'ready',
    capturedAt,
    source: 'mock',
    signals: labels.map((label, index) =>
      normalizeSignal(
        {
          id: `${label}-${index}`,
          kind: label === 'delivery-person' ? 'person' : 'object',
          label,
          confidence: 0.95,
        },
        capturedAt,
      ),
    ),
  }
}

function createMatch(overrides: Partial<ProactiveRuleMatch> = {}): ProactiveRuleMatch {
  return {
    ruleId: 'delivery-person-at-door',
    promptKey: 'delivery-person-at-door',
    message: '快递员在门口',
    confidence: 0.95,
    severity: 'info',
    priority: 'normal',
    source: 'local-rules',
    labels: ['delivery-person'],
    regions: [],
    matchedAt: 60_000,
    ...overrides,
  }
}
