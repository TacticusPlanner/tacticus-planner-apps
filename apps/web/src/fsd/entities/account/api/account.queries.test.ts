import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/shared/api"

const getCurrentUser = vi.hoisted(() => vi.fn())

vi.mock("./account.api", () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  getUserJotToken: vi.fn(),
}))

import { accountQueries } from "./account.queries"

// Instant retries: the retry *predicate* is what's under test, not the backoff.
function fetchCurrentUser() {
  const client = new QueryClient()
  return client.fetchQuery({ ...accountQueries.current(), retryDelay: 0 })
}

describe("accountQueries.current retry policy", () => {
  beforeEach(() => {
    getCurrentUser.mockReset()
  })

  it("retries a network failure three times before surfacing it", async () => {
    getCurrentUser.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(fetchCurrentUser()).rejects.toThrow("Failed to fetch")
    expect(getCurrentUser).toHaveBeenCalledTimes(4)
  })

  it("recovers when a retry succeeds", async () => {
    getCurrentUser
      .mockRejectedValueOnce(new ApiError(503, "unavailable"))
      .mockResolvedValueOnce({ applicationUserId: "u1" })

    await expect(fetchCurrentUser()).resolves.toEqual({
      applicationUserId: "u1",
    })
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it("does not retry a client error", async () => {
    getCurrentUser.mockRejectedValue(new ApiError(403, "forbidden"))

    await expect(fetchCurrentUser()).rejects.toThrow("forbidden")
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })

  it("does not retry an auth error from the token step", async () => {
    const interactionRequired = new Error("interaction_required")
    interactionRequired.name = "InteractionRequiredAuthError"
    getCurrentUser.mockRejectedValue(interactionRequired)

    await expect(fetchCurrentUser()).rejects.toThrow("interaction_required")
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })
})
