import { getRequiredEnvironmentValue } from "@/shared/config"
import { acquireAccessToken } from "@/shared/auth"

export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

type ApiRequestOptions = {
  signal?: AbortSignal
}

type ApiWriteOptions = ApiRequestOptions & {
  body?: unknown
}

// FastEndpoints' default validation-failure body: { statusCode, message, errors: { field: [messages] } }.
// Surface the first field error when present (it's the actionable one), otherwise fall back to `message`.
async function readError(
  response: Response
): Promise<{ message?: string; details?: unknown }> {
  try {
    const body = (await response.clone().json()) as {
      message?: string
      errors?: Record<string, string[]>
    }

    const firstFieldError = body.errors
      ? Object.values(body.errors)[0]?.[0]
      : undefined

    return { message: firstFieldError ?? body.message, details: body }
  } catch {
    return {}
  }
}

async function request<T>(
  method: string,
  path: string,
  options: ApiWriteOptions
): Promise<T> {
  const hasBody = options.body !== undefined
  const accessToken = await acquireAccessToken()

  const apiBaseUrl = getRequiredEnvironmentValue("VITE_API_BASE_URL").replace(
    /\/$/,
    ""
  )
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new ApiError(
      response.status,
      error.message ?? `API request failed: ${response.status}`,
      error.details
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function apiGet<T>(path: string, options: ApiRequestOptions) {
  return request<T>("GET", path, options)
}

export function apiPost<T>(path: string, options: ApiWriteOptions) {
  return request<T>("POST", path, options)
}

export function apiPut<T>(path: string, options: ApiWriteOptions) {
  return request<T>("PUT", path, options)
}

export function apiDelete<T = void>(path: string, options: ApiRequestOptions) {
  return request<T>("DELETE", path, options)
}
