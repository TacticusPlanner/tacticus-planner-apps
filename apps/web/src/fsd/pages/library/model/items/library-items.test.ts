import { describe, expect, it } from "vitest"

import {
  DEFAULT_LIBRARY_ITEMS_QUERY,
  costLadder,
  filterLibraryItems,
  groupLibraryItems,
  itemsOriginState,
  readItemsListSearch,
  readLibraryItemsQuery,
  sortLibraryItems,
  writeLibraryItemsQuery,
} from "./library-items"
import type { LibraryItem } from "./library-items"

const item = (id: string, patch: Partial<LibraryItem> = {}): LibraryItem => ({
  id,
  name: id,
  type: "I_Crit",
  rarity: "Rare",
  isRelic: false,
  allowedUnits: [],
  allowedFactions: ["Ultramarines", "Orks"],
  ...patch,
})

const items = [
  item("shield", { type: "I_Block", rarity: "Epic" }),
  item("knife"),
  item("blade", {
    rarity: "Mythic",
    isRelic: true,
    allowedUnits: ["titus"],
    allowedFactions: [],
  }),
]
const factionOf = (id: string) => (id === "titus" ? "Ultramarines" : undefined)
const ids = (patch: Partial<typeof DEFAULT_LIBRARY_ITEMS_QUERY>) =>
  filterLibraryItems(
    items,
    { ...DEFAULT_LIBRARY_ITEMS_QUERY, ...patch },
    {
      nameOf: (entry) => entry.name,
      factionOf,
      locale: "en",
    }
  ).map((entry) => entry.id)

describe("library items query", () => {
  it("round-trips through the URL, dropping unknown values", () => {
    const params = writeLibraryItemsQuery(new URLSearchParams(), {
      rarity: ["Epic"],
      relic: true,
      group: "rarity",
    })
    expect(params.toString()).toBe("rarity=Epic&relic=1&group=rarity")
    expect(
      readLibraryItemsQuery(new URLSearchParams("slot=I_Hat&group=x"))
    ).toEqual(DEFAULT_LIBRARY_ITEMS_QUERY)
  })

  it("filters by name, rarity, slot, faction and relic", () => {
    expect(ids({ q: "kni" })).toEqual(["knife"])
    expect(ids({ rarity: ["Epic"] })).toEqual(["shield"])
    expect(ids({ slot: ["I_Crit"] })).toEqual(["knife", "blade"])
    expect(ids({ faction: ["Ultramarines"] })).toEqual([
      "shield",
      "knife",
      "blade",
    ])
    expect(ids({ faction: ["Orks"] })).toEqual(["shield", "knife"])
    expect(ids({ relic: true })).toEqual(["blade"])
  })
})

describe("sortLibraryItems / groupLibraryItems", () => {
  it("orders by slot, then highest rarity, then name, and groups that order", () => {
    const sorted = sortLibraryItems(items, (entry) => entry.name, "en")
    expect(sorted.map((entry) => entry.id)).toEqual([
      "blade",
      "knife",
      "shield",
    ])
    expect(groupLibraryItems(sorted, "slot").map((g) => g.key)).toEqual([
      "I_Crit",
      "I_Block",
    ])
    expect(groupLibraryItems(sorted, "rarity").map((g) => g.key)).toEqual([
      "Mythic",
      "Epic",
      "Rare",
    ])
  })
})

describe("costLadder", () => {
  it("lists each level's cost with running totals", () => {
    const ladder = costLadder({
      upgradeLevels: [
        { goldCost: 0, salvageCost: 150, mythicSalvageCost: 0 },
        { goldCost: 750, salvageCost: 90, mythicSalvageCost: 0 },
        { goldCost: 1000, salvageCost: 120, mythicSalvageCost: 0 },
      ],
    })
    expect(ladder.at(-1)).toEqual({
      level: 3,
      gold: 1000,
      salvage: 120,
      mythicSalvage: 0,
      totalGold: 1750,
      totalSalvage: 360,
      totalMythicSalvage: 0,
    })
  })
})

describe("readItemsListSearch", () => {
  it("reads the list's search back, and ignores state it didn't write", () => {
    expect(readItemsListSearch(itemsOriginState("?relic=1"))).toBe("?relic=1")
    expect(readItemsListSearch(itemsOriginState(""))).toBe("")
    expect(readItemsListSearch(null)).toBe("")
    expect(readItemsListSearch({ itemsListSearch: "//evil" })).toBe("")
  })
})
