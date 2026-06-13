import type { CloudVisualLanguageProvider } from '../types'
import {
  readBackendClientConfig,
  readCloudAuthorityMode,
  type CloudAuthorityMode,
} from './backendClient'
import { readQwenCloudProviderConfig } from './cloudProviderConfig'
import { MockCloudVisualLanguageProvider } from './cloudVisualLanguage'
import { HttpCloudVisualLanguageProvider } from './httpCloudVisualLanguage'
import { QwenCloudVisualLanguageProvider } from './qwenCloudVisualLanguage'

export type CloudProviderKind = 'mock' | 'qwen' | 'backend'

export interface CreateCloudVisualLanguageProviderResult {
  provider: CloudVisualLanguageProvider
  kind: CloudProviderKind
  authorityMode: CloudAuthorityMode
  useClientGateway: boolean
  extractActualTokens?: (provider: CloudVisualLanguageProvider) => number | undefined
}

export function createCloudVisualLanguageProvider(
  env: Record<string, string | undefined> = import.meta.env,
  getContext?: () => {
    conversationId: string
    consent: { cloudMediaTransmission: boolean; cloudMemoryAccess: boolean }
  },
): CreateCloudVisualLanguageProviderResult {
  const backendConfig = readBackendClientConfig(env)
  const authorityMode = readCloudAuthorityMode(env)

  if (backendConfig && authorityMode !== 'client') {
    const provider = new HttpCloudVisualLanguageProvider(
      backendConfig,
      getContext ??
        (() => ({
          conversationId: 'conversation-local',
          consent: { cloudMediaTransmission: false, cloudMemoryAccess: false },
        })),
    )
    return {
      provider,
      kind: 'backend',
      authorityMode,
      useClientGateway: authorityMode === 'shadow',
      extractActualTokens: (activeProvider) => {
        if (activeProvider instanceof HttpCloudVisualLanguageProvider) {
          const telemetry = activeProvider.getLastTelemetry()
          return telemetry?.actualTokens ?? telemetry?.estimatedTokens
        }
        return undefined
      },
    }
  }

  const qwenConfig = readQwenCloudProviderConfig(env)
  if (qwenConfig) {
    const provider = new QwenCloudVisualLanguageProvider(qwenConfig)
    return {
      provider,
      kind: 'qwen',
      authorityMode: 'client',
      useClientGateway: true,
      extractActualTokens: (activeProvider) => {
        if (activeProvider instanceof QwenCloudVisualLanguageProvider) {
          return activeProvider.getLastUsageTokens()
        }
        return undefined
      },
    }
  }

  return {
    provider: new MockCloudVisualLanguageProvider(),
    kind: 'mock',
    authorityMode: 'client',
    useClientGateway: true,
  }
}
