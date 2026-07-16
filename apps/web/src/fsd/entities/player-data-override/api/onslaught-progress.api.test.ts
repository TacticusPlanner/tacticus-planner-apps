import { describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))

vi.mock("@/shared/api", () => ({ apiGet: api.get, apiPut: api.put }))

import {
  getOnslaughtProgress,
  updateOnslaughtProgress,
} from "./onslaught-progress.api"

describe("onslaught progress API", () => {
  it("maps reads and writes to the override endpoint", () => {
    const signal = new AbortController().signal
    const progress = { revision: 1 } as never

    getOnslaughtProgress(signal)
    updateOnslaughtProgress(progress)

    expect(api.get).toHaveBeenCalledWith(
      "/api/v1/me/player-data-overrides/onslaught-progress",
      { signal }
    )
    expect(api.put).toHaveBeenCalledWith(
      "/api/v1/me/player-data-overrides/onslaught-progress",
      { body: progress }
    )
  })
})
