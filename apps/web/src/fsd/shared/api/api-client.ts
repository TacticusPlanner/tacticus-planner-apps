import { getRequiredEnvironmentValue } from "@/shared/config"
import { acquireAccessToken } from "@/shared/auth"

/** The parts of an RFC 7807 problem body the client acts on (spec: api-error-handling). */
export type ApiProblem = {
  /** Machine-readable failure kind (`slotOccupied`, `goalRevisionStale`, …); features key on it. */
  issueCode?: string
  /** On a 409: the resource as it stands now, to adopt without another read. */
  current?: unknown
  /** On a 400: messages keyed by field path. */
  errors?: Record<string, string[]>
  /** Any other problem members a route documents (e.g. `blockedGoalIds`). */
  extensions?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly issueCode?: string
  readonly current?: unknown
  readonly errors?: Record<string, string[]>
  readonly extensions: Record<string, unknown>

  constructor(status: number, message: string, problem: ApiProblem = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.issueCode = problem.issueCode
    this.current = problem.current
    this.errors = problem.errors
    this.extensions = problem.extensions ?? {}
  }
}

/** `error` as an `ApiError` when its issue code is one of `codes`, else null (spec: api-error-handling:
 *  failure handling keys on the issue code, not on the body shape). */
export function apiIssue(
  error: unknown,
  ...codes: readonly string[]
): ApiError | null {
  return error instanceof ApiError &&
    error.issueCode !== undefined &&
    codes.includes(error.issueCode)
    ? error
    : null
}

/**
 * A failure worth retrying automatically: the request never reached the API (fetch rejects with a
 * TypeError on network/DNS/CORS failure) or the API answered with a rate limit or a server error —
 * the shape of a rollout or a brief outage. Everything else (4xx, auth errors from the token step,
 * aborts) is a definitive answer and is not retried.
 */
export function isTransientApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500
  }
  return error instanceof TypeError
}

type ApiRequestOptions = {
  signal?: AbortSignal
}

type ApiWriteOptions = ApiRequestOptions & {
  body?: unknown
}

// RFC 7807 members plus the ones every API problem carries; the rest are route-specific extensions.
const PROBLEM_MEMBERS = new Set([
  "type",
  "title",
  "status",
  "detail",
  "instance",
  "traceId",
  "issueCode",
  "current",
  "errors",
])

/**
 * Reads a failed response as one `ApiError`. The text is the first field message of a validation
 * failure (the actionable one), else the problem's `detail`, else its `title`, else a generic
 * "request failed" text — also used for any body that is not a JSON problem (a proxy error page).
 */
async function readError(response: Response): Promise<ApiError> {
  const generic = `API request failed with status ${response.status}`
  let body: unknown
  try {
    body = await response.clone().json()
  } catch {
    return new ApiError(response.status, generic)
  }
  if (!body || typeof body !== "object") {
    return new ApiError(response.status, generic)
  }
  const {
    title,
    detail,
    issueCode,
    current,
    errors: rawErrors,
  } = body as Record<string, unknown>
  const extensions = Object.fromEntries(
    Object.entries(body).filter(([key]) => !PROBLEM_MEMBERS.has(key))
  )
  const errors =
    rawErrors && typeof rawErrors === "object"
      ? (rawErrors as Record<string, string[]>)
      : undefined
  const text = (value: unknown) =>
    typeof value === "string" && value ? value : undefined
  return new ApiError(
    response.status,
    text(errors && Object.values(errors)[0]?.[0]) ??
      text(detail) ??
      text(title) ??
      generic,
    { issueCode: text(issueCode), current, errors, extensions }
  )
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
    throw await readError(response)
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
