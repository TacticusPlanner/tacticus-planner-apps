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
