export interface ServerConfig {
  port: number
  deviceApiToken: string
  adminApiToken: string
  corsOrigins: string[]
  databasePath: string
  qwenApiKey: string | null
  qwenBaseUrl: string
  qwenModel: string
  qwenAsrModel: string
  costPerThousandTokens: number
}

function parseCorsOrigins(value: string | undefined): string[] {
  const raw = value?.trim() || 'http://localhost:5173'
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT ?? 3000),
    deviceApiToken: env.DEVICE_API_TOKEN?.trim() || 'dev-device-token',
    adminApiToken: env.ADMIN_API_TOKEN?.trim() || 'dev-admin-token',
    corsOrigins: parseCorsOrigins(env.CORS_ORIGIN),
    databasePath: env.DATABASE_PATH?.trim() || './data/control-plane.json',
    qwenApiKey: env.QWEN_API_KEY?.trim() || null,
    qwenBaseUrl: env.QWEN_BASE_URL?.trim() || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    qwenModel: env.QWEN_MODEL?.trim() || 'qwen-vl-plus',
    qwenAsrModel: env.QWEN_ASR_MODEL?.trim() || 'paraformer-realtime-v2',
    costPerThousandTokens: Number(env.COST_PER_THOUSAND_TOKENS ?? 0.002),
  }
}
