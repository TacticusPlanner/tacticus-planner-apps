import { afterEach, describe, expect, it, vi } from "vitest"

import { seedGameCatalog } from "@/test/seed"

import { loadCampaignEventsData } from "./load-campaign-events-data"

describe("loadCampaignEventsData", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("settles a failed local read as an error instead of rejecting", async () => {
    // Simulates a failing IndexedDB read (the player-data metadata lookup) without closing the
    // real databases, which later tests reuse.
    vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(() => {
      throw new Error("IndexedDB unavailable")
    })
    await expect(loadCampaignEventsData()).resolves.toEqual({ status: "error" })
  })

  it("treats a never-synced profile (undefined) as ready, not as a failure", async () => {
    await seedGameCatalog({
      "campaign-definitions": [],
      "campaign-battles": [],
    })
    const result = await loadCampaignEventsData()
    expect(result.status).toBe("ready")
    expect(result.status === "ready" && result.data.synced).toBeUndefined()
  })
})
