import { describe, expect, it } from 'vitest'
import { getWatchOnlySamplingMode } from '../watchOnly'
import { matchLocalCommand } from '../voice/localCommands'
import { SpeechResponseController } from '../voice/speechResponseController'
import { MockStreamingTtsProvider } from '../voice/ttsProviders'
import {
  MockProactiveLocalDetector,
  ProactiveObservationHistory,
  ProactiveRulesEngine,
  createDefaultProactivePromptState,
  evaluateProactivePromptPolicy,
  filterSensitiveOcrMatch,
  normalizeSignal,
  recordProactivePromptFeedback,
  setProactivePromptsEnabled,
  setProactiveReminderIntensity,
} from './proactivePrompts'
import type {
  ProactiveDetectionResult,
  ProactivePromptCandidate,
  ProactivePromptState,
  SampledVideoFrame,
} from '../types'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'reduced',
}

describe('representative proactive prompt flows', () => {
  it('prompts when a phone leaves the camera view', async () => {
    const history = new ProactiveObservationHistory()
    history.add(detectionWithLabels(['phone'], 1_000))

    const result = await evaluateFlow({
      detection: detectionWithLabels([], 2_000),
      history,
      now: 2_000,
    })

    expect(result.accepted?.ruleId).toBe('left-behind-phone')
    expect(result.accepted?.text).toContain('可能需要')
    expect(result.accepted?.text).toContain('手机')
  })

  it('treats unattended stove flame as an urgent safety prompt', async () => {
    const detection = await new MockProactiveLocalDetector({
      signals: [
        signal('stove-flame', 'object', 0.95),
      ],
    }).detect(frame, 3_000)

    const result = await evaluateFlow({ detection, now: 3_000, userSpeaking: true })

    expect(result.match?.priority).toBe('urgent')
    expect(result.accepted?.ruleId).toBe('unattended-stove-flame')
    expect(result.accepted?.text).toContain('灶台')
  })

  it('warns about risky scissor use near fingers', async () => {
    const detection = await new MockProactiveLocalDetector({
      signals: [signal('scissors', 'object', 0.93), signal('finger-near-blade', 'action', 0.92)],
    }).detect(frame, 4_000)

    const result = await evaluateFlow({ detection, now: 4_000 })

    expect(result.accepted?.ruleId).toBe('risky-scissor-use')
    expect(result.accepted?.text).toContain('剪刀')
    expect(result.accepted?.text).toContain('可能需要')
  })

  it('allows delivery prompts during watch-only reduced sampling without dialogue', async () => {
    const samplingMode = getWatchOnlySamplingMode({
      enabled: true,
      lastDialogueAt: null,
      now: 5_000,
    })
    expect(samplingMode).toBe('reduced')

    const detection = await new MockProactiveLocalDetector({
      signals: [signal('delivery-person', 'person', 0.94)],
    }).detect({ ...frame, mode: samplingMode }, 5_000)

    const result = await evaluateFlow({ detection, now: 5_000 })

    expect(result.accepted?.ruleId).toBe('delivery-person-at-door')
    expect(result.accepted?.text).toContain('快递员')
  })

  it('disables proactive prompts from the local voice command', () => {
    expect(matchLocalCommand('闭嘴，别主动说话')?.command.action).toBe('disable-proactive-prompts')

    const disabled = setProactivePromptsEnabled(createDefaultProactivePromptState(0), false)
    const result = evaluateProactivePromptPolicy({
      match: {
        ruleId: 'delivery-person-at-door',
        promptKey: 'delivery-person-at-door',
        message: '快递员在门口',
        confidence: 0.95,
        severity: 'info',
        priority: 'normal',
        source: 'local-rules',
        labels: ['delivery-person'],
        regions: [],
        matchedAt: 6_000,
      },
      state: disabled,
      now: 6_000,
    })

    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('disabled')
  })

  it('increases reminders from the local voice command', () => {
    expect(matchLocalCommand('多提醒我')?.command.action).toBe('increase-proactive-prompts')

    const increased = setProactiveReminderIntensity(createDefaultProactivePromptState(0), 'more')
    expect(increased.settings.enabled).toBe(true)
    expect(increased.settings.reminderIntensity).toBe('more')
    expect(increased.settings.dailyCap).toBe(40)
  })

  it('queues non-urgent prompts while the user is speaking and flushes them later', async () => {
    const controller = new SpeechResponseController([new MockStreamingTtsProvider()])
    const prompt = createPrompt({ priority: 'normal' })

    const queued = await controller.speakProactivePrompt({
      prompt,
      language: 'zh',
      networkState: 'online',
      userSpeaking: true,
    })
    expect(queued.status).toBe('queued')

    const flushed = await controller.flushProactivePromptQueue({
      language: 'zh',
      networkState: 'online',
    })
    expect(flushed[0]?.status).toBe('spoken')
  })

  it('interrupts active speech for urgent safety prompts', async () => {
    const controller = new SpeechResponseController([new MockStreamingTtsProvider()])

    const result = await controller.speakProactivePrompt({
      prompt: createPrompt({ priority: 'urgent', severity: 'safety', ruleId: 'unattended-stove-flame' }),
      language: 'zh',
      networkState: 'online',
      userSpeaking: true,
    })

    expect(result.status).toBe('interrupted')
    expect(result.speechResult?.state.status).toBe('completed')
  })

  it('records correction feedback and suppresses similar future prompts', async () => {
    const state = recordProactivePromptFeedback(createDefaultProactivePromptState(0), {
      ruleId: 'delivery-person-at-door',
      promptKey: 'delivery-person-at-door',
      labels: ['delivery-person'],
      penalty: 0.1,
      createdAt: 7_900,
    })

    const detection = await new MockProactiveLocalDetector({
      signals: [signal('delivery-person', 'person', 0.94)],
    }).detect(frame, 8_000)

    const result = await evaluateFlow({ detection, state, now: 8_000 })

    expect(result.match?.confidence).toBeCloseTo(0.84)
    expect(result.accepted).toBeUndefined()
    expect(result.rejectionReason).toBe('low-confidence')
  })

  it('suppresses OCR-dependent prompts that would speak sensitive digit strings', async () => {
    const detection: ProactiveDetectionResult = {
      status: 'ready',
      capturedAt: 9_000,
      source: 'mock',
      signals: [
        normalizeSignal({
          id: 'ocr-1',
          kind: 'ocr',
          label: 'ocr-text',
          confidence: 0.96,
          ocr: { text: '1234567890', hasContinuousDigits: true },
        }),
      ],
    }

    const suppressed = filterSensitiveOcrMatch(
      {
        ruleId: 'ocr-reminder',
        promptKey: 'ocr-reminder',
        message: '号码是 1234567890',
        confidence: 0.95,
        severity: 'reminder',
        priority: 'normal',
        source: 'local-rules',
        labels: ['ocr-text'],
        regions: [],
        matchedAt: 9_000,
        requiresSensitiveSpeech: true,
      },
      detection,
    )

    expect(suppressed).toBeNull()
  })
})

async function evaluateFlow({
  detection,
  history = new ProactiveObservationHistory(),
  state = createDefaultProactivePromptState(0),
  now,
  userSpeaking = false,
}: {
  detection: ProactiveDetectionResult
  history?: ProactiveObservationHistory
  state?: ProactivePromptState
  now: number
  userSpeaking?: boolean
}) {
  history.add(detection)
  const matches = new ProactiveRulesEngine().evaluate({
    detection,
    history,
    language: 'zh',
    now,
    state,
  })

  for (const match of matches) {
    const policy = evaluateProactivePromptPolicy({
      match,
      state,
      now,
      userSpeaking,
    })
    if (policy.accepted && policy.candidate) {
      return { match, accepted: policy.candidate }
    }
    if (matches[matches.length - 1] === match) {
      return { match, rejectionReason: policy.reason }
    }
  }

  return { match: matches[0], accepted: undefined, rejectionReason: undefined }
}

function detectionWithLabels(labels: string[], capturedAt: number): ProactiveDetectionResult {
  return {
    status: 'ready',
    capturedAt,
    source: 'mock',
    signals: labels.map((label, index) => signal(label, label === 'delivery-person' ? 'person' : 'object', 0.95, index)),
  }
}

function signal(
  label: string,
  kind: 'object' | 'person' | 'action',
  confidence: number,
  index = 0,
) {
  return normalizeSignal({
    id: `${label}-${index}`,
    kind,
    label,
    confidence,
  })
}

function createPrompt(overrides: Partial<ProactivePromptCandidate> = {}): ProactivePromptCandidate {
  return {
    id: 'prompt-1',
    ruleId: 'delivery-person-at-door',
    promptKey: 'delivery-person-at-door',
    text: '快递员似乎在门口',
    confidence: 0.95,
    severity: 'info',
    priority: 'normal',
    source: 'local-rules',
    labels: ['delivery-person'],
    regions: [],
    createdAt: Date.now(),
    ...overrides,
  }
}
