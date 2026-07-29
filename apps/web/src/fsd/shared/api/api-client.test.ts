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

  it("surfaces the first validation error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: { name: ["Name is required"] },
          message: "Validation failed",
        }),
        { status: 400 }
      )
    )

    await expect(apiGet("/items", {})).rejects.toEqual(
      new ApiError(400, "Name is required")
    )
  })

  it("uses response or status fallbacks for other failures", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 })
    )
    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 500 }))

    await expect(apiGet("/forbidden", {})).rejects.toEqual(
      new ApiError(403, "Forbidden")
    )
    await expect(apiGet("/broken", {})).rejects.toEqual(
      new ApiError(500, "API request failed: 500")
    )
  })
})
