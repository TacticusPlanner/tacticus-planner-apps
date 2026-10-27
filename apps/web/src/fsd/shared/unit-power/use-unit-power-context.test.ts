import { replaceGameCatalogDataset } from "@workspace/game-catalog/testing"
import { afterEach, describe, expect, it, vi } from "vitest"

import { refreshLocalDataAfterSync } from "@/shared/local-data"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { unitPowerCatalog } from "@/test/fixtures/unit-power"
import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useUnitPowerContext } from "./use-unit-power-context"

const { unitPower, ...units } = unitPowerCatalog

function seedCatalog({ withUnitPower }: { withUnitPower: boolean }) {
  return seedGameCatalog({
    ...units,
    ...(withUnitPower ? { "unit-power": [unitPower] } : {}),
  })
}

// The manifest metadata row a completed sync writes last (the harness has no seeder for it), with
// `unit-power` stored empty: a synced catalog that does not serve the dataset.
function markCatalogSyncedWithoutUnitPower() {
  return replaceGameCatalogDataset("unit-power", [], {
    key: "__manifest",
    hash: "manifest-test",
    catalogVersion: "test",
    gameVersion: "test",
    schemaHash: "test",
    updatedAt: "2026-01-01T00:00:00Z",
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useUnitPowerContext", () => {
  it("builds the context from the catalog", async () => {
    await seedCatalog({ withUnitPower: true })
    const { result } = renderHook(() => useUnitPowerContext())
    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const state = result.current
    expect(
      state.status === "ready" && state.data?.characters.has("ultraTigurius")
    ).toBe(true)
  })

  it("is ready with no context when the dataset is absent", async () => {
    await seedCatalog({ withUnitPower: false })
    await markCatalogSyncedWithoutUnitPower()
    const { result } = renderHook(() => useUnitPowerContext())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).toBeNull()
  })

  it("stays loading while the catalog has not finished its first sync", async () => {
    await seedCatalog({ withUnitPower: false })
    const { result, queryClient } = renderHook(() => useUnitPowerContext())
    // Settled, but not synced yet: still loading, never "absent".
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.status).toBe("loading")

    // The first sync writes its manifest row and refreshes the reads it touched.
    await markCatalogSyncedWithoutUnitPower()
    refreshLocalDataAfterSync(queryClient, "catalog", ["characters"])
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).toBeNull()
  })

  it("shares one read per dataset between two mounted consumers", async () => {
    await seedCatalog({ withUnitPower: true })
    const reads = spyOnIndexedDbReads()
    const { result } = renderHook(() => [
      useUnitPowerContext(),
      useUnitPowerContext(),
    ])
    await waitFor(() => expect(result.current[1]?.status).toBe("ready"))

    // Six datasets plus the "catalog synced" metadata row, each read once.
    expect(reads.calls()).toBe(7)
  })

  it("does not consult the sync state when the dataset is present", async () => {
    // No manifest row: consulting the sync state would report "not synced" and stay loading.
    await seedCatalog({ withUnitPower: true })
    const { result } = renderHook(() => useUnitPowerContext())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).not.toBe(
      null
    )
  })

  it("reports an error when a read fails", async () => {
    await seedCatalog({ withUnitPower: true })
    const getAll = IDBObjectStore.prototype.getAll
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(function (
      this: IDBObjectStore,
      ...args
    ) {
      if (this.name === "equipment") throw new Error("blocked")
      return getAll.apply(this, args)
    })
    const { result } = renderHook(() => useUnitPowerContext())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })
})
