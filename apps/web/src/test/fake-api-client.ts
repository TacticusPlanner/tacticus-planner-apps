import type { apiClient } from "@/shared/api"

type Init = {
  params?: { path?: Record<string, string>; query?: Record<string, unknown> }
  body?: unknown
}

/** A typed call as a page test sees it: the method, the route template, its params and body. */
export type FakeApiCall = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
} & Init

/**
 * Stands in for `apiClient()` in a `vi.mock("@/shared/api")` factory: every typed call goes to `route`,
 * whose result becomes the response body (a rejection stays a rejection, as an `ApiError` would).
 */
export function fakeApiClient(
  route: (call: FakeApiCall) => unknown
): () => ReturnType<typeof apiClient> {
  const send =
    (method: FakeApiCall["method"]) =>
    async (path: string, init: Init = {}) => ({
      data: await route({ method, path, ...init }),
    })
  const client = {
    GET: send("GET"),
    POST: send("POST"),
    PUT: send("PUT"),
    DELETE: send("DELETE"),
  }
  return () => client as unknown as ReturnType<typeof apiClient>
}
