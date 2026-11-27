import { describe, expect, it } from "vitest"

import {
  activePanelFilterCount,
  CLEARED_FILTERS,
  DEFAULT_INVENTORY_UPGRADES_QUERY,
  hasActiveFilters,
  readInventoryUpgradesQuery,
  writeInventoryUpgradesQuery,
} from "./inventory-upgrades-query"

const read = (search: string) =>
  readInventoryUpgradesQuery(new URLSearchParams(search))

describe("inventory upgrades query", () => {
  it("reads an empty URL as the defaults", () => {
    expect(read("")).toEqual(DEFAULT_INVENTORY_UPGRADES_QUERY)
  })

  it("reads every part, keeping list items in a fixed order and dropping unknown values", () => {
    expect(
      read(
        "q=blade&rarity=Epic,Bogus,Common,Epic&stat=Armour,Health&kind=crafted&needed=1&owned=1&layout=table&group=stat&sort=short&material=upgCommonBlade"
      )
    ).toEqual({
      search: "blade",
      rarities: ["Common", "Epic"],
      stats: ["Health", "Armour"],
      kind: "crafted",
      needed: true,
      owned: true,
      layout: "table",
      group: "stat",
      sort: "short",
      material: "upgCommonBlade",
    })
    expect(read("layout=list&group=faction&sort=power&kind=rare")).toEqual(
      DEFAULT_INVENTORY_UPGRADES_QUERY
    )
  })

  it("writes a patch, and drops a part that is back at its default", () => {
    const written = writeInventoryUpgradesQuery(new URLSearchParams("x=1"), {
      rarities: ["Rare", "Common"],
      owned: true,
      layout: "table",
      group: "rarity",
    })
    expect(written.toString()).toBe(
      "x=1&rarity=Rare%2CCommon&owned=1&layout=table"
    )

    const cleared = writeInventoryUpgradesQuery(written, {
      rarities: [],
      owned: false,
      layout: "grid",
    })
    expect(cleared.toString()).toBe("x=1")
  })

  it("round-trips a query through the URL", () => {
    const query = {
      ...DEFAULT_INVENTORY_UPGRADES_QUERY,
      search: "core",
      stats: ["Damage" as const],
      kind: "basic" as const,
      sort: "need" as const,
    }
    expect(
      readInventoryUpgradesQuery(
        writeInventoryUpgradesQuery(new URLSearchParams(), query)
      )
    ).toEqual(query)
  })

  it("counts the panel's filters and knows when anything narrows the list", () => {
    const query = { ...DEFAULT_INVENTORY_UPGRADES_QUERY }
    expect(activePanelFilterCount(query)).toBe(0)
    expect(hasActiveFilters(query)).toBe(false)

    const narrowed = {
      ...query,
      rarities: ["Epic" as const, "Rare" as const],
      kind: "crafted" as const,
    }
    expect(activePanelFilterCount(narrowed)).toBe(2)
    expect(activePanelFilterCount({ ...narrowed, owned: true })).toBe(3)
    expect(hasActiveFilters(narrowed)).toBe(true)
    expect(hasActiveFilters({ ...query, owned: true })).toBe(true)
    expect(hasActiveFilters({ ...query, search: "  " })).toBe(false)
    expect(
      hasActiveFilters({ ...narrowed, needed: true, ...CLEARED_FILTERS })
    ).toBe(false)
  })
})
