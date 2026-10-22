import type { MockInstance } from "vitest"

/** The last `Request` a mocked `fetch` received from the typed API client, read back as plain values. */
export async function lastRequest(fetchMock: MockInstance<typeof fetch>) {
  const request = fetchMock.mock.lastCall?.[0]
  if (!(request instanceof Request)) {
    throw new Error("fetch was not called with a Request")
  }
  const text = await request.clone().text()
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: text ? (JSON.parse(text) as unknown) : undefined,
  }
}
