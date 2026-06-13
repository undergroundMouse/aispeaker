import type {
  CloudVisualAnswerRequest,
  CloudVisualAnswerResponse,
  ConversationTelemetryRecord,
  OperationsBudgetConfig,
  UpdateBudgetRequest,
} from '@ai/shared'

export interface BackendClientConfig {
  baseUrl: string
  deviceApiToken: string
  adminApiToken: string
}

export function readBackendClientConfig(
  env: Record<string, string | undefined> = import.meta.env,
): BackendClientConfig | null {
  const baseUrl = env.VITE_BACKEND_BASE_URL?.trim()
  if (!baseUrl) {
    return null
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    deviceApiToken: env.VITE_DEVICE_API_TOKEN?.trim() || 'dev-device-token',
    adminApiToken: env.VITE_ADMIN_API_TOKEN?.trim() || 'dev-admin-token',
  }
}

export type CloudAuthorityMode = 'client' | 'shadow' | 'server'

export function readCloudAuthorityMode(
  env: Record<string, string | undefined> = import.meta.env,
): CloudAuthorityMode {
  const mode = env.VITE_CLOUD_AUTHORITY_MODE?.trim()
  if (mode === 'client' || mode === 'shadow' || mode === 'server') {
    return mode
  }

  return readBackendClientConfig(env) ? 'server' : 'client'
}

export function buildAsrWebSocketUrl(config: BackendClientConfig): string {
  const url = new URL(config.baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/api/v1/cloud/asr/stream'
  url.searchParams.set('token', config.deviceApiToken)
  return url.toString()
}

export async function postCloudVisualAnswer(
  config: BackendClientConfig,
  request: CloudVisualAnswerRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<CloudVisualAnswerResponse> {
  const response = await fetchImpl(`${config.baseUrl}/api/v1/cloud/visual-answer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.deviceApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const payload = (await response.json()) as CloudVisualAnswerResponse
  if (!response.ok) {
    if (!payload.ok) {
      return payload
    }

    return {
      ok: false,
      reason: 'network',
      message: `Backend returned HTTP ${response.status}.`,
      telemetry: { estimatedTokens: 0, estimatedCost: 0 },
    }
  }

  return payload
}

export async function listAdminConversations(
  config: BackendClientConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ConversationTelemetryRecord[]> {
  const response = await fetchImpl(`${config.baseUrl}/api/v1/admin/conversations`, {
    headers: { Authorization: `Bearer ${config.adminApiToken}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to list conversations: ${response.status}`)
  }
  return (await response.json()) as ConversationTelemetryRecord[]
}

export async function getAdminBudget(
  config: BackendClientConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<OperationsBudgetConfig> {
  const response = await fetchImpl(`${config.baseUrl}/api/v1/admin/budget`, {
    headers: { Authorization: `Bearer ${config.adminApiToken}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to get budget: ${response.status}`)
  }
  return (await response.json()) as OperationsBudgetConfig
}

export async function setAdminBudget(
  config: BackendClientConfig,
  body: UpdateBudgetRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<OperationsBudgetConfig> {
  const response = await fetchImpl(`${config.baseUrl}/api/v1/admin/budget`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.adminApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Failed to set budget: ${response.status}`)
  }
  return (await response.json()) as OperationsBudgetConfig
}

export async function getAdminDailySpend(
  config: BackendClientConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const response = await fetchImpl(`${config.baseUrl}/api/v1/admin/daily-spend`, {
    headers: { Authorization: `Bearer ${config.adminApiToken}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to get daily spend: ${response.status}`)
  }
  const payload = (await response.json()) as { amount: number }
  return payload.amount
}
