import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))

vi.mock("@/shared/api", () => ({ apiGet: api.get, apiPut: api.put }))

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

describe("onslaught progress API", () => {
  it("maps reads and writes to the override endpoint", () => {
    const signal = new AbortController().signal

    getOnslaughtProgress(signal)
    updateOnslaughtProgress(progress)

    expect(api.get).toHaveBeenCalledWith(
      "/api/v1/me/player-data-overrides/onslaught-progress",
      { signal }
    )
    expect(api.put).toHaveBeenCalledWith(
      "/api/v1/me/player-data-overrides/onslaught-progress",
      { body: mapOnslaughtProgressToRequestDto(progress) }
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
