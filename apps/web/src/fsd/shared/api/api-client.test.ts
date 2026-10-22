import { beforeEach, describe, expect, it, vi } from "vitest"

const acquireAccessToken = vi.hoisted(() => vi.fn())

vi.mock("@/shared/auth", () => ({ acquireAccessToken }))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example/",
}))

import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "./api-client"

describe("API client", () => {
  beforeEach(() => {
    acquireAccessToken.mockReset().mockResolvedValue("access-token")
    vi.restoreAllMocks()
  })

  it("authenticates GET requests and returns JSON", async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: 42 }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    )

    await expect(
      apiGet<{ value: number }>("/items", { signal })
    ).resolves.toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/items", {
      body: undefined,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer access-token",
      },
      method: "GET",
      signal,
    })
  })

  it("serializes POST and PUT request bodies", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), { status: 200 })
        )
      )

    await apiPost("/items", { body: { name: "one" } })
    await apiPut("/items/1", { body: { name: "two" } })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example/items",
      expect.objectContaining({
        body: JSON.stringify({ name: "one" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        method: "POST",
      })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example/items/1",
      expect.objectContaining({
        body: JSON.stringify({ name: "two" }),
        method: "PUT",
      })
    )
  })

  it("returns undefined for a successful DELETE with no content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 })
    )

    await expect(apiDelete("/items/1", {})).resolves.toBeUndefined()
  })

  const problem = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/problem+json" },
    })

  it("reads a problem body's issue code, detail and current state", async () => {
    const current = { goalId: "goal-1", revision: 8 }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      problem(409, {
        title: "Conflict",
        detail: "The goal changed since it was loaded.",
        issueCode: "goalRevisionStale",
        current,
      })
    )

    await expect(apiPut("/goals/goal-1", { body: {} })).rejects.toMatchObject({
      status: 409,
      issueCode: "goalRevisionStale",
      message: "The goal changed since it was loaded.",
      current,
    })
  })

  it("names a validation failure's fields and uses the first field message", async () => {
    const errors = { "target.rank.end": ["Rank must be above the start."] }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      problem(400, {
        title: "One or more validation errors occurred.",
        issueCode: "validation",
        errors,
      })
    )

    await expect(apiPut("/goals/goal-1", { body: {} })).rejects.toMatchObject({
      status: 400,
      issueCode: "validation",
      message: "Rank must be above the start.",
      errors,
    })
  })

  it("keeps a route's documented extension members", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      problem(400, {
        title: "Bad Request",
        issueCode: "lastProjectMembership",
        blockedGoalIds: ["goal-1"],
        traceId: "trace",
      })
    )

    await expect(
      apiPut("/projects/p/goals", { body: {} })
    ).rejects.toMatchObject({ extensions: { blockedGoalIds: ["goal-1"] } })
  })

  it("falls back to the title, then to a generic text for a non-problem body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(problem(403, { title: "Forbidden" }))
    fetchMock.mockResolvedValueOnce(
      new Response("<html>Bad gateway</html>", { status: 502 })
    )

    await expect(apiGet("/forbidden", {})).rejects.toEqual(
      new ApiError(403, "Forbidden")
    )
    const failure = apiGet("/broken", {})
    await expect(failure).rejects.toMatchObject({
      status: 502,
      issueCode: undefined,
      message: "API request failed with status 502",
    })
  })
})
