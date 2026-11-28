import { describe, expect, it } from "vitest"

import {
  DEFAULT_TIER_LIST_FILTERS,
  formatMultiplier,
  hasActiveFilters,
  isAwaitingOwnedRoster,
  isTierListEmpty,
  parseTierListFilters,
  shouldAutoExpandUntiered,
  tierListSearchParams,
  tierTileDetails,
} from "./tier-list.view-model"

const untieredTile = {
  unitId: "x",
  multiplier: 1,
  overridden: false,
  owned: undefined,
  relics: [],
}

const parse = (query: string) =>
  parseTierListFilters(new URLSearchParams(query))

describe("parseTierListFilters", () => {
  it("defaults every filter when the query is empty", () => {
    expect(parse("")).toEqual(DEFAULT_TIER_LIST_FILTERS)
  })

  it("reads q, owned=1 and a lowercase alliance", () => {
    expect(parse("q=kar&owned=1&alliance=xenos")).toEqual({
      query: "kar",
      onlyOwned: true,
      alliance: "Xenos",
    })
    expect(parse("alliance=imperial").alliance).toBe("Imperial")
    expect(parse("alliance=Chaos").alliance).toBe("Chaos")
  })

  it("falls back to the defaults on invalid values", () => {
    expect(parse("owned=yes&alliance=tyranids")).toEqual(
      DEFAULT_TIER_LIST_FILTERS
    )
    expect(parse("owned=0&alliance=").onlyOwned).toBe(false)
    expect(parse("alliance=all").alliance).toBe("all")
  })
})

describe("tierListSearchParams", () => {
  it("writes non-default filters and keeps unrelated params", () => {
    const next = tierListSearchParams(new URLSearchParams("tab=x&q=old"), {
      query: "cal",
      onlyOwned: true,
      alliance: "Imperial",
    })
    expect(next.toString()).toBe("tab=x&q=cal&owned=1&alliance=imperial")
  })

  it("leaves defaults out of the URL", () => {
    const next = tierListSearchParams(
      new URLSearchParams("q=cal&owned=1&alliance=chaos"),
      DEFAULT_TIER_LIST_FILTERS
    )
    expect(next.toString()).toBe("")
  })

  it("round-trips through parseTierListFilters", () => {
    const filters = {
      query: "a b",
      onlyOwned: true,
      alliance: "Chaos",
    } as const
    expect(
      parseTierListFilters(tierListSearchParams(new URLSearchParams(), filters))
    ).toEqual(filters)
  })
})

describe("hasActiveFilters / isTierListEmpty", () => {
  it("ignores a blank query", () => {
    expect(
      hasActiveFilters({ ...DEFAULT_TIER_LIST_FILTERS, query: "  " })
    ).toBe(false)
    expect(
      hasActiveFilters({ ...DEFAULT_TIER_LIST_FILTERS, alliance: "Xenos" })
    ).toBe(true)
  })

  it("is empty only when every row and Untiered are empty", () => {
    const row = { tier: "S", multiplier: 1.85, units: [] }
    expect(isTierListEmpty({ rows: [row], untiered: [] })).toBe(true)
    expect(
      isTierListEmpty({
        rows: [row],
        untiered: [untieredTile],
      })
    ).toBe(false)
  })
})

describe("shouldAutoExpandUntiered", () => {
  const empty = { tier: "S", multiplier: 1.85, units: [] }
  const query = { ...DEFAULT_TIER_LIST_FILTERS, query: "dante" }

  it("opens Untiered when a filter is active and only untiered characters match", () => {
    expect(
      shouldAutoExpandUntiered(
        { rows: [empty], untiered: [untieredTile] },
        query
      )
    ).toBe(true)
  })

  it("stays closed without filters, with a tiered match, or with no untiered match", () => {
    expect(
      shouldAutoExpandUntiered(
        { rows: [empty], untiered: [untieredTile] },
        DEFAULT_TIER_LIST_FILTERS
      )
    ).toBe(false)
    expect(
      shouldAutoExpandUntiered(
        {
          rows: [{ ...empty, units: [{ ...untieredTile, multiplier: 1.85 }] }],
          untiered: [untieredTile],
        },
        query
      )
    ).toBe(false)
    expect(
      shouldAutoExpandUntiered({ rows: [empty], untiered: [] }, query)
    ).toBe(false)
  })
})

describe("isAwaitingOwnedRoster", () => {
  it("waits only while Only owned is asked for and the roster is loading", () => {
    const owned = { ...DEFAULT_TIER_LIST_FILTERS, onlyOwned: true }
    expect(isAwaitingOwnedRoster(owned, "loading")).toBe(true)
    expect(isAwaitingOwnedRoster(owned, "ready")).toBe(false)
    expect(isAwaitingOwnedRoster(owned, "error")).toBe(false)
    expect(isAwaitingOwnedRoster(DEFAULT_TIER_LIST_FILTERS, "loading")).toBe(
      false
    )
  })
})

describe("formatMultiplier", () => {
  it("shows one to two decimals with the × sign", () => {
    expect(formatMultiplier(2, "en")).toBe("2.0×")
    expect(formatMultiplier(1.95, "en")).toBe("1.95×")
    expect(formatMultiplier(1, "de")).toBe("1,0×")
  })
})

describe("tierTileDetails", () => {
  const tile = { unitId: "custoBladeChampion", multiplier: 2, overridden: true }
  const row = { tier: "S", multiplier: 1.85 }

  it("carries the tier default only when overridden", () => {
    expect(tierTileDetails(tile, row, []).tierMultiplier).toBe(1.85)
    expect(
      tierTileDetails({ ...tile, overridden: false }, row, []).tierMultiplier
    ).toBeNull()
    expect(tierTileDetails(tile, null, []).tier).toBeNull()
  })

  it("reads ownership from the roster", () => {
    expect(tierTileDetails(tile, row, undefined).ownership).toEqual({
      state: "unknown",
    })
    expect(tierTileDetails(tile, row, []).ownership).toEqual({
      state: "locked",
    })
    expect(
      tierTileDetails(tile, row, [
        {
          unitId: "custoBladeChampion",
          rank: "Gold1",
          progressionIndex: "Epic:RedOneStar",
        } as never,
      ]).ownership
    ).toEqual({ state: "owned", rarity: "Epic", rank: "Gold1" })
  })
})
