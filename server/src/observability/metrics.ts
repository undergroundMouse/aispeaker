export interface ProviderMetric {
  provider: string
  success: boolean
  latencyMs: number
  at: number
}

const metrics: ProviderMetric[] = []

export function recordProviderMetric(provider: string, success: boolean, latencyMs: number): void {
  metrics.push({ provider, success, latencyMs, at: Date.now() })
  if (metrics.length > 1000) {
    metrics.splice(0, metrics.length - 1000)
  }
}

export function getProviderMetrics(provider?: string): ProviderMetric[] {
  return provider ? metrics.filter((m) => m.provider === provider) : [...metrics]
}

export function getProviderSuccessRate(provider: string): number {
  const entries = metrics.filter((m) => m.provider === provider)
  if (entries.length === 0) {
    return 1
  }
  return entries.filter((m) => m.success).length / entries.length
}
