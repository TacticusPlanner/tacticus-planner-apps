import { describe, expect, it } from "vitest"

import type { Team, TeamRoster, TeamRosterUnit } from "@/entities/team"

import {
  charactersLeftByRarity,
  lineupUnit,
  logBlock,
  offenseTeams,
} from "./offense"
import type { Selection } from "./offense"

const team = (id: string, overrides: Partial<Team> = {}): Team => ({
  id,
  revision: 1,
  position: 1,
  name: id,
  modes: ["warOffense"],
  characterIds: [],
  flexStartIndex: null,
  mowIds: [],
  mowFlexStartIndex: null,
  campaignGroupId: null,
  incursionMowIds: [],
  notes: null,
  rarityCap: null,
  issues: [],
  ...overrides,
})

const unit = (progression: TeamRosterUnit["progression"]): TeamRosterUnit => ({
  progression,
  rank: "Gold1",
  xpLevel: 40,
  abilityLevels: [30, 28],
})

const roster: TeamRoster = {
  characters: new Map([
    ["a", unit("Legendary:RedThreeStars")],
    ["b", unit("Epic:RedOneStar")],
    ["c", unit("Legendary:RedFourStars")],
    ["d", unit("Rare:FourStars")],
    ["e", unit("Rare:FiveStars")],
    ["f", unit("Rare:FiveStars")],
  ]),
  mows: new Map([
    ["m", unit("Epic:RedOneStar")],
    ["n", unit("Rare:FourStars")],
  ]),
}

const pick = (...ids: string[]): Selection =>
  new Map(ids.map((id) => [id, roster.mows.has(id) ? "mow" : "character"]))

describe("offenseTeams", () => {
  it("lists War Offense teams, ready first, blocked by a deployed core unit", () => {
    const teams = [
      team("blocked", { characterIds: ["a", "b"] }),
      team("flexOnly", { characterIds: ["c", "a"], flexStartIndex: 1 }),
      team("defense", { modes: ["warDefense"], characterIds: ["c"] }),
      team("mow", { characterIds: ["c"], mowIds: ["m"] }),
    ]
    const listed = offenseTeams(teams, new Set(["a", "m"]))
    expect(listed.map((entry) => [entry.team.id, entry.blockedBy?.id])).toEqual(
      [
        ["flexOnly", undefined],
        ["blocked", "a"],
        ["mow", "m"],
      ]
    )
  })
})

const check = (selection: Selection, overrides = {}) =>
  logBlock({
    selection,
    deployed: new Set(["d"]),
    roster,
    tokensLeft: 3,
    ...overrides,
  })

describe("logBlock", () => {
  it("allows 1 to 5 characters and at most one MoW", () => {
    expect(check(pick("a", "m"))).toBeNull()
    expect(check(pick("m"))).toEqual({ reason: "noCharacter" })
    expect(check(pick("a", "b", "c", "e", "f", "x"))).toEqual({
      reason: "tooManyCharacters",
    })
    expect(check(pick("a", "m", "n"))).toEqual({ reason: "tooManyMows" })
  })

  it("names a deployed or unowned unit", () => {
    expect(check(pick("a", "d"))).toEqual({
      reason: "deployed",
      unitId: "d",
      kind: "character",
    })
    expect(check(pick("a", "x"))).toEqual({
      reason: "notOwned",
      unitId: "x",
      kind: "character",
    })
  })

  it("needs a token", () => {
    expect(check(pick("a"), { tokensLeft: 0 })).toEqual({ reason: "noTokens" })
  })
})

describe("lineupUnit", () => {
  it("copies the roster unit, with no rank for a MoW", () => {
    expect(lineupUnit(roster, "character", "a")).toEqual({
      unitId: "a",
      progression: "Legendary:RedThreeStars",
      rank: "Gold1",
      xpLevel: 40,
      abilityLevels: [30, 28],
    })
    expect(lineupUnit(roster, "mow", "m")?.rank).toBeNull()
    expect(lineupUnit(roster, "character", "x")).toBeNull()
  })
})

describe("charactersLeftByRarity", () => {
  it("counts the undeployed characters by rarity, highest first", () => {
    expect(charactersLeftByRarity(roster, new Set(["a", "e"]))).toEqual([
      { rarity: "Legendary", count: 1 },
      { rarity: "Epic", count: 1 },
      { rarity: "Rare", count: 2 },
    ])
  })
})
