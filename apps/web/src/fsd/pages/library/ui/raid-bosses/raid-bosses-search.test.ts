import { describe, expect, it } from "vitest"

import {
  repairRaidBossesSearch,
  type RaidBossesSearchState,
} from "./raid-bosses-search"

const known: RaidBossesSearchState = {
  catalogReady: true,
  metaReady: true,
  entityId: "Tervigon",
  entityKnown: true,
  firstEntityId: "Tervigon",
  hasExactLocation: false,
  seasonIds: ["s1", "s2"],
  selectedSeasonId: "s1",
  compId: undefined,
}
const bare: RaidBossesSearchState = {
  ...known,
  entityId: undefined,
  entityKnown: false,
}
const unknown: RaidBossesSearchState = {
  ...known,
  entityId: "not-real",
  entityKnown: false,
}

const repair = (search: string, state: RaidBossesSearchState) => {
  const result = repairRaidBossesSearch(new URLSearchParams(search), state)
  return (
    result && { pathname: result.pathname, search: result.search.toString() }
  )
}

describe("repairRaidBossesSearch", () => {
  it("waits for the catalog", () => {
    expect(repair("tab=invalid", { ...known, catalogReady: false })).toBeNull()
  })

  it("leaves valid state alone", () => {
    expect(
      repair("tab=meta&season=s2&view=compact", {
        ...known,
        selectedSeasonId: "s2",
      })
    ).toBeNull()
    expect(repair("", bare)).toBeNull()
  })

  it("returns an unknown entity without a tab to the bare collection, dropping its context", () => {
    expect(
      repair("season=s2&tier=1&set=1&encounter=1", {
        ...unknown,
        selectedSeasonId: "s2",
      })
    ).toEqual({
      pathname: "/library/raid-bosses",
      search: "season=s2",
    })
  })

  it("sends an unknown entity with a tab to the first entity", () => {
    expect(repair("tab=meta", unknown)).toEqual({
      pathname: "/library/raid-bosses/Tervigon",
      search: "tab=meta",
    })
  })

  it("drops invalid encounter context as a group", () => {
    expect(
      repair("season=s1&tier=6&set=0&encounter=1&view=compact", known)
    ).toEqual({
      pathname: undefined,
      search: "season=s1&view=compact",
    })
    expect(repair("tier=6", known)).toEqual({ pathname: undefined, search: "" })
  })

  it("keeps valid encounter context", () => {
    expect(
      repair("season=s2&tier=1&set=1&encounter=1", {
        ...known,
        hasExactLocation: true,
        selectedSeasonId: "s2",
      })
    ).toBeNull()
  })

  it("repairs an invalid tab to details", () => {
    expect(repair("tab=invalid&view=compact", known)).toEqual({
      pathname: undefined,
      search: "tab=details&view=compact",
    })
  })

  it("normalises an unknown season", () => {
    // No entity and no tab: the default season is implied, so the param is dropped.
    expect(repair("season=missing&view=compact", bare)).toEqual({
      pathname: undefined,
      search: "view=compact",
    })
    // An entity or a tab keeps the resolved season explicit.
    expect(repair("season=missing", known)).toEqual({
      pathname: undefined,
      search: "season=s1",
    })
    expect(repair("tab=seasons&season=missing", bare)).toEqual({
      pathname: undefined,
      search: "tab=seasons&season=s1",
    })
    // No season to resolve to: the param is dropped.
    expect(
      repair("season=missing", { ...known, selectedSeasonId: undefined })
    ).toEqual({
      pathname: undefined,
      search: "",
    })
  })

  it("drops an unknown comp once the Meta dataset is known", () => {
    expect(repair("tab=meta&comp=invalid", known)).toEqual({
      pathname: undefined,
      search: "tab=meta",
    })
    expect(
      repair("tab=meta&comp=invalid", { ...known, metaReady: false })
    ).toBeNull()
    expect(
      repair("tab=meta&comp=admech", { ...known, compId: "admech" })
    ).toBeNull()
  })

  it("applies every repair in one pass", () => {
    expect(
      repair("tab=invalid&season=invalid&comp=invalid&source=shared", unknown)
    ).toEqual({
      pathname: "/library/raid-bosses/Tervigon",
      search: "tab=details&season=s1&source=shared",
    })
  })
})
