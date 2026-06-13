/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QWEN_API_KEY?: string
  readonly VITE_QWEN_BASE_URL?: string
  readonly VITE_QWEN_MODEL?: string
  readonly VITE_BACKEND_BASE_URL?: string
  readonly VITE_DEVICE_API_TOKEN?: string
  readonly VITE_ADMIN_API_TOKEN?: string
  readonly VITE_CLOUD_AUTHORITY_MODE?: 'client' | 'shadow' | 'server'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
