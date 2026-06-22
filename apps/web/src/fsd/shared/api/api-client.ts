import { getRequiredEnvironmentValue } from "@/shared/config"

const apiBaseUrl = getRequiredEnvironmentValue("VITE_API_BASE_URL").replace(
  /\/$/,
  ""
)

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type ApiGetOptions = {
  accessToken: string
  signal?: AbortSignal
}

export async function apiGet<T>(path: string, options: ApiGetOptions) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request failed: ${response.status}`
    )
  }

  return (await response.json()) as T
}
