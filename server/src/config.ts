export interface ServerConfig {
  port: number
  deviceApiToken: string
  adminApiToken: string
  corsOrigin: string
  databasePath: string
  qwenApiKey: string | null
  qwenBaseUrl: string
  qwenModel: string
  costPerThousandTokens: number
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT ?? 3000),
    deviceApiToken: env.DEVICE_API_TOKEN?.trim() || 'dev-device-token',
    adminApiToken: env.ADMIN_API_TOKEN?.trim() || 'dev-admin-token',
    corsOrigin: env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
    databasePath: env.DATABASE_PATH?.trim() || './data/control-plane.json',
    qwenApiKey: env.QWEN_API_KEY?.trim() || null,
    qwenBaseUrl: env.QWEN_BASE_URL?.trim() || 'https://llm.wavespeed.ai/v1',
    qwenModel: env.QWEN_MODEL?.trim() || 'qwen/qwen3-vl-8b-thinking',
    costPerThousandTokens: Number(env.COST_PER_THOUSAND_TOKENS ?? 0.002),
  }
}
