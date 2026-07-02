type EnvironmentVariableName =
  | "VITE_API_BASE_URL"
  | "VITE_API_SCOPE"
  | "VITE_MSAL_AUTHORITY"
  | "VITE_MSAL_CLIENT_ID"
  | "VITE_MSAL_TENANT_ID"

export function getRequiredEnvironmentValue(name: EnvironmentVariableName) {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

type AppEnvironment = "local" | "staging" | "production"

// Distinct from Vite's built-in MODE/PROD (both "staging" and "production" are plain `vite build`
// output — Vite can't tell them apart). Each deployment sets VITE_APP_ENV explicitly; defaults to
// "local" so plain `vite dev` with no env override behaves like a local environment.
function getAppEnvironment(): AppEnvironment {
  return import.meta.env.VITE_APP_ENV ?? "local"
}

// The UI Kit showcase page is a dev/QA aid — available locally and on staging, hidden in production.
export const isUiKitEnabled = getAppEnvironment() !== "production"
