import { replaceGameCatalogDataset } from "@workspace/game-catalog/testing"
import { afterEach, describe, expect, it, vi } from "vitest"

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
    schemaVersion: 1,
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
    const { result } = renderHook(() => useUnitPowerContext())
    // Settled, but not synced yet: still loading, never "absent".
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.status).toBe("loading")

    // The live query re-reads once the first sync writes its manifest row.
    await markCatalogSyncedWithoutUnitPower()
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).toBeNull()
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
