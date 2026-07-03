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

// `vite dev` runs in "development" mode; `vite build --mode staging`/`--mode production` (see the
// app's build:staging/build:production scripts) set MODE to match, loading .env.staging/.env.production
// respectively. Anything else (e.g. a plain `vite build` with no --mode) falls back to "local".
function getAppEnvironment(): AppEnvironment {
  const mode = import.meta.env.MODE
  if (mode === "staging") return "staging"
  if (mode === "production") return "production"
  return "local"
}

// The UI Kit showcase page is a dev/QA aid — available locally and on staging, hidden in production.
export const isUiKitEnabled = getAppEnvironment() !== "production"
