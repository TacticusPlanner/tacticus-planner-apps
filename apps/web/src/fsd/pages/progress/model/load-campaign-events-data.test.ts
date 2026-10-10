import { beforeEach, describe, expect, it, vi } from "vitest"

const reads = vi.hoisted(() => ({ synced: vi.fn() }))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignDefinitions: async () => [],
  getCampaignBattles: async () => [],
}))
vi.mock("@workspace/player-data/queries", () => ({
  getCampaignEventProgress: () => reads.synced(),
  getPlayerCharacters: async () => [],
  getLiveProgress: async () => undefined,
}))

import { loadCampaignEventsData } from "./load-campaign-events-data"

describe("loadCampaignEventsData", () => {
  beforeEach(() => {
    reads.synced.mockReset()
  })

  it("settles a failed local read as an error instead of rejecting", async () => {
    reads.synced.mockRejectedValue(new Error("IndexedDB unavailable"))
    await expect(loadCampaignEventsData()).resolves.toEqual({ status: "error" })
  })

  it("treats a never-synced profile (undefined) as ready, not as a failure", async () => {
    reads.synced.mockResolvedValue(undefined)
    const result = await loadCampaignEventsData()
    expect(result.status).toBe("ready")
    expect(result.status === "ready" && result.data.synced).toBeUndefined()
  })
})
