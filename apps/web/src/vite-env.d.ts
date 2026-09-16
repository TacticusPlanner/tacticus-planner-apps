/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_SCOPE: string
  readonly VITE_MSAL_AUTHORITY: string
  readonly VITE_MSAL_CLIENT_ID: string
  readonly VITE_MSAL_TENANT_ID: string
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string
  readonly VITE_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
