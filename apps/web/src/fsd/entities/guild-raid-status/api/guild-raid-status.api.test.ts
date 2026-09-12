import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>()
  return { ...actual, apiGet: api.get, apiPost: api.post }
})

import { ApiError } from "@/shared/api"

import type { GuildRaidStatusResponse } from "./guild-raid-status.api"
import {
  getGuildRaidStatus,
  refreshGuildRaidStatus,
} from "./guild-raid-status.api"

function statusResponse(): GuildRaidStatusResponse {
  return {
    state: "noActiveSeason",
    observedAt: "2026-07-12T12:00:00.000Z",
    freshness: "fresh",
    lastGuildSyncSucceededAt: "2026-07-12T12:00:00.000Z",
    season: null,
  }
}

describe("getGuildRaidStatus", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the observed status on success", async () => {
    const status = statusResponse()
    api.get.mockResolvedValue(status)

    await expect(getGuildRaidStatus()).resolves.toEqual({
      kind: "observed",
      status,
    })
  })

  it("maps the no-observation 409 to a neverObserved result", async () => {
    api.get.mockRejectedValue(
      new ApiError(
        409,
        "The linked guild has no Guild Raid status observation yet."
      )
    )

    await expect(getGuildRaidStatus()).resolves.toEqual({
      kind: "neverObserved",
    })
  })

  it("propagates other 409 conflict reasons instead of treating them as never-observed", async () => {
    const error = new ApiError(
      409,
      "The linked guild has never completed synchronization."
    )
    api.get.mockRejectedValue(error)

    await expect(getGuildRaidStatus()).rejects.toBe(error)
  })

  it("propagates non-409 errors", async () => {
    const error = new ApiError(
      503,
      "The Tacticus Guild Raid API is currently unavailable."
    )
    api.get.mockRejectedValue(error)

    await expect(getGuildRaidStatus()).rejects.toBe(error)
  })
})

describe("refreshGuildRaidStatus", () => {
  beforeEach(() => vi.clearAllMocks())

  it("posts to the refresh endpoint", () => {
    const status = statusResponse()
    api.post.mockResolvedValue(status)

    void refreshGuildRaidStatus()

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/guilds/me/raid-status/refresh",
      { signal: undefined }
    )
  })
})
