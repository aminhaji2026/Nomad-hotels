/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_SURFACE?: 'customer' | 'ops' | string
  readonly VITE_CUSTOMER_APP_URL?: string
  readonly VITE_OPS_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
