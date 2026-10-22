import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { ApiError } from "@/shared/api"
import { lastRequest } from "@/test/last-request"

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

const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/problem+json" },
      })
    )
  )

describe("getGuildRaidStatus", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns the observed status on success", async () => {
    const status = statusResponse()
    const fetch = respond(200, status)

    await expect(getGuildRaidStatus()).resolves.toEqual({
      kind: "observed",
      status,
    })
    expect(await lastRequest(fetch)).toMatchObject({
      method: "GET",
      url: "https://api.example/api/v1/guild/raid-status",
    })
  })

  it("maps the no-observation 409 to a neverObserved result", async () => {
    respond(409, {
      detail: "The linked guild has no Guild Raid status observation yet.",
    })

    await expect(getGuildRaidStatus()).resolves.toEqual({
      kind: "neverObserved",
    })
  })

  it("propagates other 409 conflict reasons instead of treating them as never-observed", async () => {
    respond(409, {
      detail: "The linked guild has never completed synchronization.",
    })

    await expect(getGuildRaidStatus()).rejects.toMatchObject({
      status: 409,
      message: "The linked guild has never completed synchronization.",
    })
  })

  it("propagates non-409 errors", async () => {
    respond(503, {
      detail: "The Tacticus Guild Raid API is currently unavailable.",
    })

    await expect(getGuildRaidStatus()).rejects.toBeInstanceOf(ApiError)
  })
})

describe("refreshGuildRaidStatus", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("posts to the refresh endpoint", async () => {
    const status = statusResponse()
    const fetch = respond(200, status)

    await expect(refreshGuildRaidStatus()).resolves.toEqual(status)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: "https://api.example/api/v1/guild/raid-status/refresh",
    })
  })
})
