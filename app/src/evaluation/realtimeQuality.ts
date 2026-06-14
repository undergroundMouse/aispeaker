export const QUIET_ENVIRONMENT_FIXTURE = [
  { expected: '打开摄像头', actual: '打开摄像头' },
  { expected: '这是什么', actual: '这是什么' },
  { expected: 'hello assistant', actual: 'hello assistant' },
]

export const INTERRUPT_FIXTURE = [
  { ttsActive: true, userSpeechRms: 0.08, expectedInterrupt: true },
  { ttsActive: true, userSpeechRms: 0.01, expectedInterrupt: false },
]

export const TRACKING_FIXTURE = [
  {
    frames: [
      { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
      { x: 0.21, y: 0.31, width: 0.2, height: 0.2 },
    ],
    minIou: 0.7,
  },
]

export function computeWordAccuracy(pairs: Array<{ expected: string; actual: string }>): number {
  let correct = 0
  let total = 0
  for (const pair of pairs) {
    const expectedWords = pair.expected.split(/\s+/)
    const actualWords = pair.actual.split(/\s+/)
    total += expectedWords.length
    for (let i = 0; i < expectedWords.length; i += 1) {
      if (expectedWords[i] === actualWords[i]) {
        correct += 1
      }
    }
  }
  return total > 0 ? correct / total : 1
}

export function computeInterruptSuccessRate(
  results: Array<{ expectedInterrupt: boolean; actualInterrupt: boolean }>,
): number {
  if (results.length === 0) {
    return 1
  }
  const correct = results.filter((r) => r.expectedInterrupt === r.actualInterrupt).length
  return correct / results.length
}

export function computeLatencyPercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) {
    return 0
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)] ?? 0
}
