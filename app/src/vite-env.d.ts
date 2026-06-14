/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QWEN_API_KEY?: string
  readonly VITE_QWEN_BASE_URL?: string
  readonly VITE_QWEN_MODEL?: string
  readonly VITE_BACKEND_BASE_URL?: string
  readonly VITE_DEVICE_API_TOKEN?: string
  readonly VITE_ADMIN_API_TOKEN?: string
  readonly VITE_CLOUD_AUTHORITY_MODE?: 'client' | 'shadow' | 'server'
  readonly VITE_REALTIME_SESSION_MODE?: string
  readonly VITE_FULL_DUPLEX_ENABLED?: string
  readonly VITE_VISION_LEVEL3_ENABLED?: string
  readonly VITE_HYBRID_OMNI_DIALOGUE?: string
  readonly VITE_OMNI_VL_CORRECTION_MODE?: 'ui-only' | 'spoken'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
