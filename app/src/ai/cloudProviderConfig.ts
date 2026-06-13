export interface QwenCloudProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export const DEFAULT_QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
export const DEFAULT_QWEN_MODEL = 'qwen-vl-plus'

export function readQwenCloudProviderConfig(
  env: Record<string, string | undefined> = import.meta.env,
): QwenCloudProviderConfig | null {
  const apiKey = env.VITE_QWEN_API_KEY?.trim()
  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    baseUrl: env.VITE_QWEN_BASE_URL?.trim() || DEFAULT_QWEN_BASE_URL,
    model: env.VITE_QWEN_MODEL?.trim() || DEFAULT_QWEN_MODEL,
  }
}

export function isQwenCloudProviderConfigured(
  env: Record<string, string | undefined> = import.meta.env,
): boolean {
  return readQwenCloudProviderConfig(env) !== null
}
