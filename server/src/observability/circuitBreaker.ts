export interface CircuitBreakerState {
  failures: number
  openUntil: number
  isOpen: boolean
}

const breakers = new Map<string, CircuitBreakerState>()
const FAILURE_THRESHOLD = 5
const OPEN_DURATION_MS = 30_000

export function getCircuitBreaker(name: string): {
  allowRequest: () => boolean
  recordSuccess: () => void
  recordFailure: () => void
  getState: () => CircuitBreakerState
} {
  if (!breakers.has(name)) {
    breakers.set(name, { failures: 0, openUntil: 0, isOpen: false })
  }

  const state = breakers.get(name)!

  return {
    allowRequest: () => {
      if (state.isOpen && Date.now() < state.openUntil) {
        return false
      }
      if (state.isOpen && Date.now() >= state.openUntil) {
        state.isOpen = false
        state.failures = 0
      }
      return true
    },
    recordSuccess: () => {
      state.failures = 0
      state.isOpen = false
    },
    recordFailure: () => {
      state.failures += 1
      if (state.failures >= FAILURE_THRESHOLD) {
        state.isOpen = true
        state.openUntil = Date.now() + OPEN_DURATION_MS
      }
    },
    getState: () => ({ ...state }),
  }
}

export function getAllCircuitBreakerStates(): Record<string, CircuitBreakerState> {
  const result: Record<string, CircuitBreakerState> = {}
  for (const [name, state] of breakers) {
    result[name] = { ...state }
  }
  return result
}
