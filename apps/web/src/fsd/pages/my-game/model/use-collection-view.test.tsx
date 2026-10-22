import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setTestAuth } from "@/test/auth"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { useCollectionView } from "./use-collection-view"

// `testTitus` has no English translation, so its display name can only come from the catalog.
const titusRecord = {
  unitId: "testTitus",
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

// Fails every read of one IndexedDB store (by database and store name) until restored.
function failReads(database: "game-catalog" | "player-data", store: string) {
  const getAll = IDBObjectStore.prototype.getAll
  return vi
    .spyOn(IDBObjectStore.prototype, "getAll")
    .mockImplementation(function (this: IDBObjectStore, ...args) {
      if (
        this.name === store &&
        this.transaction.db.name === `tacticus-planner-${database}`
      ) {
        throw new Error(`${database} unavailable`)
      }
      return getAll.apply(this, args)
    })
}

function renderCollectionView() {
  return renderHook(() => useCollectionView())
}

describe("useCollectionView", () => {
  beforeEach(async () => {
    setTestAuth({ authenticated: true })
    await seedGameCatalog({
      characters: [
        {
          id: "testTitus",
          name: "Titus",
          faction: "Ultramarines",
          alliance: "Imperial",
          initialRarity: "Epic",
        },
      ],
      mows: [],
      "unlock-shard-costs": [{ rarity: "Epic", shards: 250 }],
      equipment: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("is loading until the catalog and roster reads settle", async () => {
    const { result } = renderCollectionView()

    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("reports an anonymous roster without reading player data", async () => {
    setTestAuth({ authenticated: false })
    failReads("player-data", "characters")
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.view.rosterState
    ).toBe("anonymous")
  })

  it("surfaces a catalog failure as a retryable error", async () => {
    const failing = failReads("game-catalog", "characters")
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("catalogError"))
    failing.mockRestore()
    act(() => {
      if (result.current.status === "catalogError") result.current.retry()
    })
    await waitFor(() => expect(result.current.status).toBe("ready"))
  })

  it("keeps the catalog when only the roster read fails", async () => {
    await seedPlayerData({ characters: [titusRecord] })
    failReads("player-data", "characters")
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    const view =
      result.current.status === "ready" ? result.current.view : undefined
    expect(view?.rosterState).toBe("error")
    expect(view?.total).toBe(1)
  })

  it("names a unit without a translation by its catalog name, not its id", async () => {
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    const view =
      result.current.status === "ready" ? result.current.view : undefined
    expect(view?.groups[0]?.units[0]?.name).toBe("Titus")
  })

  it("shows the roster once a sync lands, without remounting", async () => {
    const { result } = renderCollectionView()
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.view.rosterState
    ).toBe("notSynced")

    await act(() =>
      seedPlayerData({
        characters: [titusRecord],
        mows: [],
        "inventory-shards": [],
      })
    )

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
