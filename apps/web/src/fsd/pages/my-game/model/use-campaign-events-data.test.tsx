import { afterEach, describe, expect, it, vi } from "vitest"

import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useCampaignEventsData } from "./use-campaign-events-data"

describe("useCampaignEventsData", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("settles a failed local read as an error instead of rejecting", async () => {
    // Simulates a failing IndexedDB read (the player-data metadata lookup) without closing the
    // real databases, which later tests reuse.
    vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(() => {
      throw new Error("IndexedDB unavailable")
    })
    const { result } = renderHook(() => useCampaignEventsData())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })

  it("treats a never-synced profile (undefined) as ready, not as a failure", async () => {
    await seedGameCatalog({
      "campaign-definitions": [],
      "campaign-battles": [],
    })
    const { result } = renderHook(() => useCampaignEventsData())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.data.synced
    ).toBeUndefined()
  })
})
