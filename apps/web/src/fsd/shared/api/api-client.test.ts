import { beforeEach, describe, expect, it, vi } from "vitest"

const acquireAccessToken = vi.hoisted(() => vi.fn())

vi.mock("@/shared/auth", () => ({ acquireAccessToken }))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example/",
}))

import { lastRequest } from "@/test/last-request"

import { ApiError, apiClient, isTransientApiError, unwrap } from "./api-client"

describe("API client problem bodies", () => {
  beforeEach(() => {
    acquireAccessToken.mockReset().mockResolvedValue("access-token")
    vi.restoreAllMocks()
  })

  const putGoal = () =>
    unwrap(
      apiClient().PUT("/api/v1/goals/{goalId}", {
        params: { path: { goalId: "goal-1" } },
        body: {},
      })
    )
  const getGoals = () => unwrap(apiClient().GET("/api/v1/goals"))

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

    await expect(putGoal()).rejects.toMatchObject({
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

    await expect(putGoal()).rejects.toMatchObject({
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

    await expect(putGoal()).rejects.toMatchObject({
      extensions: { blockedGoalIds: ["goal-1"] },
    })
  })

  it("reads a 429's Retry-After seconds, and leaves them unset without the header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ title: "Too Many", issueCode: "guildSyncCooldown" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/problem+json",
            "Retry-After": "42",
          },
        }
      )
    )
    fetchMock.mockResolvedValueOnce(problem(429, { issueCode: "rateLimited" }))

    await expect(putGoal()).rejects.toMatchObject({
      issueCode: "guildSyncCooldown",
      retryAfterSeconds: 42,
    })
    await expect(putGoal()).rejects.toMatchObject({
      issueCode: "rateLimited",
      retryAfterSeconds: undefined,
    })
  })

  it("falls back to the title, then to a generic text for a non-problem body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(problem(403, { title: "Forbidden" }))
    fetchMock.mockResolvedValueOnce(
      new Response("<html>Bad gateway</html>", { status: 502 })
    )

    await expect(getGoals()).rejects.toEqual(new ApiError(403, "Forbidden"))
    const failure = getGoals()
    await expect(failure).rejects.toMatchObject({
      status: 502,
      issueCode: undefined,
      message: "API request failed with status 502",
    })
  })
})

describe("typed API client", () => {
  beforeEach(() => {
    acquireAccessToken.mockReset().mockResolvedValue("access-token")
    vi.restoreAllMocks()
  })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })

  it("sends the bearer token, the typed query and returns the body", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(json({ goals: [], orderRevision: 3 }))

    await expect(
      unwrap(
        apiClient().GET("/api/v1/goals", {
          params: { query: { archived: true } },
        })
      )
    ).resolves.toEqual({ goals: [], orderRevision: 3 })

    const request = await lastRequest(fetchMock)
    expect(request.method).toBe("GET")
    expect(request.url).toBe("https://api.example/api/v1/goals?archived=true")
    expect(request.headers.get("Authorization")).toBe("Bearer access-token")
    expect(request.headers.get("Accept")).toBe("application/json")
  })

  it("serializes the body of a typed write", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(json({ goals: [], orderRevision: 4 }))

    await unwrap(
      apiClient().POST("/api/v1/goals/status", {
        body: { goalIds: ["goal-1"], status: "Paused" },
      })
    )

    const request = await lastRequest(fetchMock)
    expect(request.method).toBe("POST")
    expect(request.body).toEqual({ goalIds: ["goal-1"], status: "Paused" })
    expect(request.headers.get("Content-Type")).toBe("application/json")
  })

  it("throws the same ApiError for a 409 problem", async () => {
    const current = { goalId: "goal-1", revision: 8 }
    const errors = { "target.rank.end": ["Rank must be above the start."] }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Conflict",
          detail: "The goal changed since it was loaded.",
          issueCode: "goalRevisionStale",
          current,
          errors,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/problem+json" },
        }
      )
    )

    const failure = unwrap(
      apiClient().PUT("/api/v1/goals/{goalId}", {
        params: { path: { goalId: "goal-1" } },
        body: {},
      })
    )

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({
      status: 409,
      issueCode: "goalRevisionStale",
      current,
      errors,
    })
  })

  it("resolves undefined for a 204", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 })
    )

    await expect(
      unwrap(
        apiClient().DELETE("/api/v1/goals/{goalId}", {
          params: { path: { goalId: "goal-1" } },
        })
      )
    ).resolves.toBeUndefined()
  })

  it("lets a network failure through as a transient error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    )

    const failure = unwrap(apiClient().GET("/api/v1/goals"))

    await expect(failure).rejects.toBeInstanceOf(TypeError)
    expect(
      isTransientApiError(await failure.catch((error: unknown) => error))
    ).toBe(true)
  })
})
