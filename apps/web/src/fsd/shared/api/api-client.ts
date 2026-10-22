import createClient, { type Client, type Middleware } from "openapi-fetch"

import { getRequiredEnvironmentValue } from "@/shared/config"
import { acquireAccessToken } from "@/shared/auth"

import type { components, paths } from "./schema"

/** The API's request/response schemas, generated from its OpenAPI document (`pnpm api:types`). */
export type ApiSchemas = components["schemas"]

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

// Bearer token on the way out; any non-2xx becomes the same ApiError as above, so callers never see
// openapi-fetch's `{ error }` branch.
const authAndErrors: Middleware = {
  async onRequest({ request }) {
    request.headers.set("Authorization", `Bearer ${await acquireAccessToken()}`)
    return request
  },
  async onResponse({ response }) {
    if (!response.ok) {
      throw await readError(response)
    }
    return response
  },
}

/**
 * The typed client for `/api/v1` routes (spec: api-contract-sync): paths, params, bodies and responses
 * come from the generated `schema.d.ts`. Built per call: the base URL is read at call time like the
 * rest of the config, and `fetch` is looked up per request so a test's stubbed `fetch` is the one used.
 */
export function apiClient(): Client<paths> {
  const client = createClient<paths>({
    baseUrl: getRequiredEnvironmentValue("VITE_API_BASE_URL").replace(
      /\/$/,
      ""
    ),
    headers: { Accept: "application/json" },
    fetch: (request) => globalThis.fetch(request),
  })
  client.use(authAndErrors)
  return client
}

/** The response body of a typed call; failures already threw `ApiError` (204 resolves `undefined`). */
export async function unwrap<T>(call: Promise<{ data?: T }>): Promise<T> {
  return (await call).data as T
}
