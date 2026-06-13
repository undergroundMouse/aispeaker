import type { AsrEvaluationResult, TtsNaturalnessEvaluation, TtsProviderKind } from '../types'
import { normalizePhrase } from './localCommands'

export interface AsrEvaluationCase {
  expected: string
  actual: string
}

export const quietEnvironmentAsrFixture: AsrEvaluationCase[] = [
  { expected: '你好', actual: '你好' },
  { expected: '这是什么', actual: '这是什么' },
  { expected: '我现在在哪类场景', actual: '我现在在哪类场景' },
  { expected: 'switch to english', actual: 'switch to english' },
  { expected: 'tell me what is in the room', actual: 'tell me what is in the room' },
]

export function evaluateAsrWordAccuracy(cases: AsrEvaluationCase[]): AsrEvaluationResult {
  let expectedWords = 0
  let correctWords = 0

  for (const item of cases) {
    const expected = tokenizeUtterance(item.expected)
    const actual = tokenizeUtterance(item.actual)
    expectedWords += expected.length

    for (let index = 0; index < expected.length; index += 1) {
      if (expected[index] === actual[index]) {
        correctWords += 1
      }
    }
  }

  const wordAccuracy = expectedWords === 0 ? 1 : correctWords / expectedWords
  return {
    expectedWords,
    correctWords,
    wordAccuracy,
    passed: wordAccuracy > 0.95,
  }
}

export function evaluateTtsNaturalness(
  provider: TtsProviderKind,
  mos: number,
): TtsNaturalnessEvaluation {
  return {
    provider,
    mos,
    passed: mos > 4.0,
  }
}

function tokenizeUtterance(value: string): string[] {
  const normalized = normalizePhrase(value)
  if (/\s/.test(normalized)) {
    return normalized.split(' ').filter(Boolean)
  }

  return Array.from(normalized)
}
