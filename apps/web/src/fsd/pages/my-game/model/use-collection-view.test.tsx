import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { refreshLocalDataAfterSync } from "@/shared/local-data"
import { setTestAuth } from "@/test/auth"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import {
  defaultCollectionQuery,
  type CollectionQuery,
} from "./collection-query"
import {
  useCollectionView,
  type CollectionViewState,
} from "./use-collection-view"

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

function renderCollectionView(query?: CollectionQuery) {
  return renderHook(() => useCollectionView(query))
}

const inventory = {
  xpBooks: [],
  abilityBadges: { imperial: [], xenos: [], chaos: [] },
  components: {
    imperial: { amount: 0 },
    xenos: { amount: 0 },
    chaos: { amount: 0 },
  },
  forgeBadges: [],
  orbs: {
    imperial: [{ rarity: "Legendary", amount: 10 }],
    xenos: [],
    chaos: [],
  },
  requisitionOrdersRegular: 0,
  requisitionOrdersBlessed: 0,
  resetStones: 0,
}

// Titus at Epic red one star with 260 shards: 250 shards and 10 Legendary orbs reach Legendary.
const ladder = (
  [
    ["Epic:RedTwoStars", 65, 0, null],
    ["Epic:RedThreeStars", 85, 0, null],
    ["Legendary:RedThreeStars", 100, 10, "Legendary"],
  ] as const
).map(([progression, shards, orbs, orbRarity]) => ({
  id: progression,
  progression,
  shards,
  mythicShards: 0,
  orbs,
  orbRarity,
}))

async function seedSyncedRoster(chunks: Record<string, unknown> = {}) {
  await seedPlayerData({
    characters: [{ ...titusRecord, shards: 260 }],
    mows: [],
    "inventory-shards": [],
    ...chunks,
  })
}

function ready(state: CollectionViewState) {
  return state.status === "ready" ? state : undefined
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
          meleeDamage: "Bolter",
          meleeHits: 2,
          rangedDamage: "Bolter",
          rangedHits: 2,
          rangeDistance: 2,
          movement: 3,
          traits: [],
          activeAbilityDamage: [],
          passiveAbilityDamage: [],
          shardLocations: [],
          equipmentSlots: ["I_Crit", "I_Block", "I_Defensive"],
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
    const { result, queryClient } = renderCollectionView()
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.view.rosterState
    ).toBe("notSynced")

    await act(async () => {
      await seedPlayerData({
        characters: [titusRecord],
        mows: [],
        "inventory-shards": [],
      })
      refreshLocalDataAfterSync(queryClient, "player", [
        "characters",
        "mows",
        "inventory-shards",
      ])
    })

    await waitFor(() =>
      expect(
        result.current.status === "ready" && result.current.view.rosterState
      ).toBe("available")
    )
    expect(result.current.status === "ready" && result.current.view.owned).toBe(
      1
    )
  })
  it("offers every quick filter once the roster, inventory and their catalog data are read", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ inventory, "inventory-upgrades": [] })
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(ready(result.current)?.quickFilters).toEqual({
      readyToRankUp: "available",
      needToAscend: "available",
      canAscend: "available",
      needToLevel: "available",
      blueStarReady: "available",
      missingEquipment: "available",
      abilitiesBehindLevel: "available",
    })
  })

  it("needs a roster for every quick filter while signed out", async () => {
    setTestAuth({ authenticated: false })
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(Object.values(ready(result.current)?.quickFilters ?? {})).toEqual(
      Array(7).fill("needsRoster")
    )
  })

  it("marks only Ready to rank up failed when the upgrade recipes cannot be read", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ inventory, "inventory-upgrades": [] })
    failReads("game-catalog", "upgrades")
    const { result } = renderCollectionView()

    await waitFor(() =>
      expect(ready(result.current)?.quickFilters.readyToRankUp).toBe("failed")
    )
    expect(ready(result.current)?.view.total).toBe(1)
    expect(ready(result.current)?.quickFilters.canAscend).toBe("available")
  })

  it("needs the upgrade inventory only for Ready to rank up", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ inventory })
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(ready(result.current)?.quickFilters).toMatchObject({
      readyToRankUp: "needsInventory",
      canAscend: "available",
      blueStarReady: "available",
    })
  })

  it("needs the orb inventory for Can ascend and Blue star ready", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ "inventory-upgrades": [] })
    const { result } = renderCollectionView()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(ready(result.current)?.quickFilters).toMatchObject({
      readyToRankUp: "available",
      canAscend: "needsInventory",
      blueStarReady: "needsInventory",
      needToAscend: "available",
    })
  })

  it("does not narrow the list by a quick filter it cannot offer", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ "inventory-upgrades": [] })
    const { result } = renderCollectionView({
      ...defaultCollectionQuery,
      quick: "blueStarReady",
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(ready(result.current)?.view).toMatchObject({
      total: 1,
      filtered: false,
    })
  })

  it("never shows the list unfiltered while a selected quick filter is loading its data", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ inventory, "inventory-upgrades": [] })
    const states: CollectionViewState[] = []
    renderHook(() => {
      const state = useCollectionView({
        ...defaultCollectionQuery,
        quick: "canAscend",
        alliance: "Xenos",
      })
      states.push(state)
      return state
    })

    await waitFor(() => expect(states.at(-1)?.status).toBe("ready"))
    expect(states[0]?.status).toBe("loading")
    for (const state of states) {
      if (state.status === "ready") expect(state.view.total).toBe(0)
    }
  })

  it("lists Titus under Can ascend from his shards and Imperial orbs", async () => {
    await seedGameCatalog({ "ascension-costs": ladder, upgrades: [] })
    await seedSyncedRoster({ inventory, "inventory-upgrades": [] })
    const { result } = renderCollectionView({
      ...defaultCollectionQuery,
      quick: "canAscend",
    })

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(ready(result.current)?.view).toMatchObject({
      total: 1,
      owned: 1,
      filtered: true,
    })
  })
})
