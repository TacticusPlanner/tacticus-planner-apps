import { act, renderHook, waitFor } from "@testing-library/react"
import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"

// Stand-in for Dexie's live query: re-runs the querier whenever its deps change or the test signals
// a database write (`emitDbChange`), which is the contract the hook relies on to pick up a sync.
const live = vi.hoisted(() => ({ listeners: new Set<() => void>() }))
function emitDbChange() {
  act(() => live.listeners.forEach((listener) => listener()))
}
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery<T>(querier: () => Promise<T>, deps: unknown[] = []) {
    const [value, setValue] = useState<T | undefined>(undefined)
    const [version, setVersion] = useState(0)
    useEffect(() => {
      const listener = () => setVersion((v) => v + 1)
      live.listeners.add(listener)
      return () => {
        live.listeners.delete(listener)
      }
    }, [])
    useEffect(() => {
      let active = true
      void querier().then((result) => {
        if (active) setValue(result)
      })
      return () => {
        active = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, version])
    return value
  },
}))

const auth = vi.hoisted(() => ({ isAuthenticated: true }))
vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => auth.isAuthenticated,
}))

const catalog = vi.hoisted(() => ({ fail: false }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharacters: async () => {
    if (catalog.fail) throw new Error("catalog unavailable")
    return [
      {
        id: "ultraTitus",
        name: "Titus",
        faction: "Ultramarines",
        alliance: "Imperial",
        initialRarity: "Epic",
      },
    ]
  },
  getMows: async () => [],
  getUnlockShardCosts: async () => [{ rarity: "Epic", shards: 250 }],
  getEquipmentMap: async () => new Map(),
}))

const roster = vi.hoisted(() => ({
  characters: undefined as unknown[] | undefined,
  fail: false,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: async () => {
    if (roster.fail) throw new Error("roster unavailable")
    return roster.characters
  },
  getPlayerMows: async () => (roster.characters ? [] : undefined),
  getInventoryShards: async () => (roster.characters ? [] : undefined),
}))

import { useCollectionView } from "./use-collection-view"

const titusRecord = {
  unitId: "ultraTitus",
  progressionIndex: "Epic:RedOneStar",
  rank: "Silver1",
  xp: 0,
  xpLevel: 30,
  shards: 0,
  mythicShards: 0,
  abilities: [],
  appliedUpgradeSlots: [],
  equippedItems: [],
}

async function renderCollectionView() {
  const i18n = await createTestI18n("en")
  return renderHook(() => useCollectionView(), { wrapper: i18nWrapper(i18n) })
}

describe("useCollectionView", () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    catalog.fail = false
    roster.characters = undefined
    roster.fail = false
  })

  it("is loading until the catalog and roster reads settle", async () => {
    const { result } = await renderCollectionView()

    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("reports an anonymous roster without reading player data", async () => {
    auth.isAuthenticated = false
    roster.fail = true
    const { result } = await renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.view.rosterState
    ).toBe("anonymous")
  })

  it("surfaces a catalog failure as a retryable error", async () => {
    catalog.fail = true
    const { result } = await renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("catalogError"))
    catalog.fail = false
    act(() => {
      if (result.current.status === "catalogError") result.current.retry()
    })
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("keeps the catalog when only the roster read fails", async () => {
    roster.fail = true
    const { result } = await renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    const view =
      result.current.status === "ready" ? result.current.view : undefined
    expect(view?.rosterState).toBe("error")
    expect(view?.total).toBe(1)
  })

  it("names a unit without a translation by its catalog name, not its id", async () => {
    const { result } = await renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    const view =
      result.current.status === "ready" ? result.current.view : undefined
    expect(view?.groups[0]?.units[0]?.name).toBe("Titus")
  })

  it("shows the roster once a sync lands, without remounting", async () => {
    const { result } = await renderCollectionView()
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.view.rosterState
    ).toBe("notSynced")

    roster.characters = [titusRecord]
    emitDbChange()

    await waitFor(() =>
      expect(
        result.current.status === "ready" && result.current.view.rosterState
      ).toBe("available")
    )
    expect(result.current.status === "ready" && result.current.view.owned).toBe(
      1
    )
  })
})
