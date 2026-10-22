import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { lastRequest } from "@/test/last-request"

import {
  getOnslaughtProgress,
  mapOnslaughtProgressToRequestDto,
  updateOnslaughtProgress,
} from "./onslaught-progress.api"

const progress = {
  imperial: { sector: "Gold", tier: 2, isSet: true },
  xenos: { sector: "Stone", tier: 1, isSet: false },
  chaos: { sector: "Iron", tier: 4, isSet: true },
  revision: 3,
} as const

const respond = (body: unknown) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
    )

const url =
  "https://api.example/api/v1/player-data-overrides/onslaught-progress"

describe("onslaught progress API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("maps reads and writes to the override endpoint", async () => {
    const fetch = respond(progress)

    expect(await getOnslaughtProgress()).toEqual(progress)
    expect(await lastRequest(fetch)).toMatchObject({ method: "GET", url })

    expect(await updateOnslaughtProgress(progress)).toEqual(progress)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url,
      body: mapOnslaughtProgressToRequestDto(progress),
    })
  })

  it("rejects a tier outside 1–4", async () => {
    respond({ ...progress, chaos: { sector: "Iron", tier: 7, isSet: true } })

    await expect(getOnslaughtProgress()).rejects.toThrow(
      "Unexpected Onslaught tier 7"
    )
  })

  it("sends unset alliances as null instead of their Stone 1 placeholder", () => {
    expect(mapOnslaughtProgressToRequestDto(progress)).toEqual({
      imperial: { sector: "Gold", tier: 2 },
      xenos: null,
      chaos: { sector: "Iron", tier: 4 },
      revision: 3,
    })
  })
})
