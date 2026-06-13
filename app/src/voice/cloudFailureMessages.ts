import type { CloudGatewayFailureReason } from '@ai/shared'
import type { AppLanguage } from '../types'
import type { NetworkState } from '../types'

export function getNetworkRetryMessage(language: AppLanguage): string {
  return language === 'zh' ? '网络不佳，请重试' : 'Network is poor. Please try again.'
}

export function getBudgetExceededMessage(language: AppLanguage): string {
  return language === 'zh' ? '今日云端预算已用尽' : "Today's cloud budget is used up."
}

export function getOfflineCloudMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '当前设备离线，无法使用云端视觉问答。'
    : 'Device is offline. Cloud visual Q&A is unavailable.'
}

export function getWeakNetworkCloudMessage(language: AppLanguage): string {
  return language === 'zh' ? '网络不稳定，请稍后再试。' : 'Network is unstable. Please try again shortly.'
}

export function getBackendUnreachableMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '无法连接本地后端，请先运行 npm run dev:server。'
    : 'Cannot reach the local backend. Run npm run dev:server first.'
}

export function getCloudMediaConsentMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '请先在设置中授权云端媒体传输。'
    : 'Enable cloud media transmission in Settings first.'
}

export function getInvalidCloudApiKeyMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '云端 API 密钥无效或未填写。请在阿里云百炼获取密钥（sk- 开头），写入 server/.env 的 QWEN_API_KEY 后重启后端。'
    : 'Cloud API key is invalid or missing. Get a DashScope key (sk-...) from Alibaba Cloud, set QWEN_API_KEY in server/.env, and restart the backend.'
}

export function getCloudProviderUnavailableMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '云端服务暂时不可用，请稍后重试。'
    : 'Cloud service is temporarily unavailable. Try again later.'
}

export function getQwenNotConfiguredMessage(language: AppLanguage): string {
  return language === 'zh'
    ? '服务端未配置 Qwen API 密钥。'
    : 'Qwen API key is not configured on the server.'
}

export function getUnavailableCloudMessage(language: AppLanguage, networkState: NetworkState): string {
  if (networkState === 'offline') {
    return getOfflineCloudMessage(language)
  }

  if (networkState === 'weak') {
    return getWeakNetworkCloudMessage(language)
  }

  return getNetworkRetryMessage(language)
}

export function resolveCloudFailureMessage(
  language: AppLanguage,
  reason: CloudGatewayFailureReason,
  serverMessage?: string,
): string {
  const normalized = serverMessage?.trim().toLocaleLowerCase() ?? ''

  if (reason === 'budget-exceeded') {
    return serverMessage?.trim() || getBudgetExceededMessage(language)
  }

  if (reason === 'network') {
    if (
      normalized.includes('backend returned http') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('fetch failed') ||
      normalized.includes('econnrefused') ||
      normalized.includes('networkerror')
    ) {
      return getBackendUnreachableMessage(language)
    }

    return getNetworkRetryMessage(language)
  }

  if (
    normalized.includes('cloud media transmission is not authorized') ||
    serverMessage?.includes('云端媒体')
  ) {
    return getCloudMediaConsentMessage(language)
  }

  if (normalized.includes('qwen provider is not configured') || serverMessage?.includes('未配置 Qwen')) {
    return getQwenNotConfiguredMessage(language)
  }

  if (normalized.includes('invalid token')) {
    return getInvalidCloudApiKeyMessage(language)
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('fetch failed') ||
    normalized.includes('econnrefused') ||
    normalized.includes('networkerror')
  ) {
    return getBackendUnreachableMessage(language)
  }

  if (serverMessage?.trim() && !serverMessage.includes('网络不佳')) {
    return serverMessage.trim()
  }

  return getCloudProviderUnavailableMessage(language)
}

export function resolveFetchFailureMessage(language: AppLanguage, error: unknown): string {
  if (error instanceof TypeError) {
    return getBackendUnreachableMessage(language)
  }

  if (error instanceof Error) {
    const normalized = error.message.toLocaleLowerCase()
    if (
      normalized.includes('fetch') ||
      normalized.includes('network') ||
      normalized.includes('econnrefused') ||
      normalized.includes('failed')
    ) {
      return getBackendUnreachableMessage(language)
    }
  }

  return getNetworkRetryMessage(language)
}
