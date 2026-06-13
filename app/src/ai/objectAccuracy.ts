export interface ObjectEvaluationCase {
  id: string
  expectedLabel: string
  predictedLabel: string
}

export interface ObjectAccuracyResult {
  total: number
  correct: number
  accuracy: number
  passed: boolean
}

export const commonObjectAccuracyThreshold = 0.85

export const commonObjectEvaluationFixture: ObjectEvaluationCase[] = [
  { id: 'cup-1', expectedLabel: 'cup', predictedLabel: 'cup' },
  { id: 'book-1', expectedLabel: 'book', predictedLabel: 'book' },
  { id: 'phone-1', expectedLabel: 'phone', predictedLabel: 'phone' },
  { id: 'bottle-1', expectedLabel: 'bottle', predictedLabel: 'bottle' },
  { id: 'chair-1', expectedLabel: 'chair', predictedLabel: 'chair' },
  { id: 'laptop-1', expectedLabel: 'laptop', predictedLabel: 'laptop' },
  { id: 'pen-1', expectedLabel: 'pen', predictedLabel: 'pen' },
  { id: 'plate-1', expectedLabel: 'plate', predictedLabel: 'plate' },
  { id: 'remote-1', expectedLabel: 'remote', predictedLabel: 'remote' },
  { id: 'keys-1', expectedLabel: 'keys', predictedLabel: 'wallet' },
]

export function evaluateObjectAccuracy(
  cases: ObjectEvaluationCase[],
  threshold = commonObjectAccuracyThreshold,
): ObjectAccuracyResult {
  const correct = cases.filter(
    (item) => normalizeLabel(item.expectedLabel) === normalizeLabel(item.predictedLabel),
  ).length
  const accuracy = cases.length === 0 ? 0 : correct / cases.length

  return {
    total: cases.length,
    correct,
    accuracy,
    passed: accuracy >= threshold,
  }
}

function normalizeLabel(label: string): string {
  return label.trim().toLocaleLowerCase()
}
