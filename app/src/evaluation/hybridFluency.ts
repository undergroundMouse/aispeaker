import { computeLatencyPercentile } from './realtimeQuality'

export const HYBRID_FIRST_AUDIO_FIXTURE_MS = [420, 510, 680, 720, 760, 790, 795, 798]

export const HYBRID_BARGE_IN_FIXTURE = [
  { assistantSpeaking: true, userSpeechDetected: true, expectedInterrupt: true },
  { assistantSpeaking: true, userSpeechDetected: false, expectedInterrupt: false },
  { assistantSpeaking: false, userSpeechDetected: true, expectedInterrupt: false },
]

export const HYBRID_OBJECT_ROUTING_FIXTURE = [
  { transcript: '你好', expectTier: 'omni-direct' as const },
  { transcript: '这是什么', expectTier: 'local-hints' as const, shouldUseCloud: false },
  { transcript: '这是什么', expectTier: 'vl-verify' as const, shouldUseCloud: true },
]

export const HYBRID_SOAK_WINDOW_MS = 30 * 60 * 1000
export const HYBRID_SOAK_CI_WINDOW_MS = 1_000

export function evaluateHybridFirstAudioP95(samples: number[]): {
  p95Ms: number
  pass: boolean
} {
  const p95Ms = computeLatencyPercentile(samples, 95)
  return { p95Ms, pass: p95Ms < 800 }
}

export function evaluateHybridBargeInSuccess(
  results: Array<{ expectedInterrupt: boolean; actualInterrupt: boolean }>,
): number {
  if (results.length === 0) {
    return 1
  }

  const correct = results.filter((entry) => entry.expectedInterrupt === entry.actualInterrupt).length
  return correct / results.length
}

export function evaluateHybridSoakStability(samples: number[]): boolean {
  if (samples.length === 0) {
    return true
  }

  const peak = Math.max(...samples)
  const baseline = samples[0] ?? 0
  return peak - baseline < 512 * 1024 * 1024
}
