import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { unitPowerCatalog } from "@/test/fixtures/unit-power"

const queries = vi.hoisted(() => ({
  getUnitPower: vi.fn(),
  getCharacters: vi.fn(),
  getMows: vi.fn(),
  getNpcs: vi.fn(),
  getEquipment: vi.fn(),
  getUpgrades: vi.fn(),
}))
vi.mock("@workspace/game-catalog/queries", () => queries)
// A plain useLiveQuery stand-in: resolves the querier once per dependency change.
vi.mock("dexie-react-hooks", async () => {
  const { useEffect, useState } = await import("react")
  return {
    useLiveQuery: <T>(querier: () => Promise<T>, deps: unknown[]) => {
      const [value, setValue] = useState<T>()
      useEffect(() => {
        void querier().then(setValue)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, deps)
      return value
    },
  }
})

import { useUnitPowerContext } from "./use-unit-power-context"

beforeEach(() => {
  queries.getUnitPower.mockResolvedValue(unitPowerCatalog.unitPower)
  queries.getCharacters.mockResolvedValue(unitPowerCatalog.characters)
  queries.getMows.mockResolvedValue(unitPowerCatalog.mows)
  queries.getNpcs.mockResolvedValue(unitPowerCatalog.npcs)
  queries.getEquipment.mockResolvedValue(unitPowerCatalog.equipment)
  queries.getUpgrades.mockResolvedValue(unitPowerCatalog.upgrades)
})

describe("useUnitPowerContext", () => {
  it("builds the context from the catalog", async () => {
    const { result } = renderHook(() => useUnitPowerContext())
    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const state = result.current
    expect(
      state.status === "ready" && state.data?.characters.has("ultraTigurius")
    ).toBe(true)
  })

  it("is ready with no context when the dataset is absent", async () => {
    queries.getUnitPower.mockResolvedValue(null)
    const { result } = renderHook(() => useUnitPowerContext())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.status === "ready" && result.current.data).toBeNull()
  })

  it("reports an error when a read fails", async () => {
    queries.getEquipment.mockRejectedValue(new Error("blocked"))
    const { result } = renderHook(() => useUnitPowerContext())
    await waitFor(() => expect(result.current.status).toBe("error"))
  })
})
