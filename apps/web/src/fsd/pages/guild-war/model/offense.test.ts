import { describe, expect, it } from "vitest"

import type { Team, TeamRoster, TeamRosterUnit } from "@/entities/team"

import {
  charactersLeftByRarity,
  deployedZones,
  kindFull,
  lineupUnit,
  logBlock,
  offenseTeams,
  previewCharacters,
  toggleSelection,
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
  it("lists War Offense teams, ready first, with every deployed core unit", () => {
    const teams = [
      team("blocked", { characterIds: ["a", "b", "d"] }),
      team("flexOnly", { characterIds: ["c", "a"], flexStartIndex: 1 }),
      team("defense", { modes: ["warDefense"], characterIds: ["c"] }),
      team("mow", { characterIds: ["c"], mowIds: ["m"] }),
    ]
    const listed = offenseTeams(teams, new Set(["a", "d", "m"]))
    expect(
      listed.map((entry) => [
        entry.team.id,
        entry.deployedCore.map((unit) => unit.id),
      ])
    ).toEqual([
      ["flexOnly", []],
      ["blocked", ["a", "d"]],
      ["mow", ["m"]],
    ])
  })
})

const check = (selection: Selection, overrides = {}) =>
  logBlock({
    selection,
    deployed: new Set(["d"]),
    roster,
    tokensLeft: 3,
    levelPicked: true,
    hasTarget: true,
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

  it("needs a battlefield level, then a zone, to log at", () => {
    expect(check(pick("a"), { levelPicked: false, hasTarget: false })).toEqual({
      reason: "noLevel",
    })
    expect(check(pick("a"), { hasTarget: false })).toEqual({ reason: "noZone" })
  })
})

describe("selection limits", () => {
  it("is full at 5 characters or 1 Machine of War, and never adds past it", () => {
    const five = pick("a", "b", "c", "e", "f")
    expect(kindFull(five, "character")).toBe(true)
    expect(kindFull(five, "mow")).toBe(false)
    expect([...toggleSelection(five, "x", "character").keys()]).toEqual([
      "a",
      "b",
      "c",
      "e",
      "f",
    ])
    // A picked unit can still be taken out, and a MoW still added.
    expect(toggleSelection(five, "a", "character").has("a")).toBe(false)
    const withMow = toggleSelection(five, "m", "mow")
    expect(withMow.get("m")).toBe("mow")
    expect(kindFull(withMow, "mow")).toBe(true)
    expect(toggleSelection(withMow, "n", "mow").has("n")).toBe(false)
  })
})

describe("previewCharacters", () => {
  const list = Array.from({ length: 40 }, (_, index) => index)

  it("shows the first ones and counts the rest", () => {
    const { shown, hidden } = previewCharacters(list, {
      expanded: false,
      narrowed: false,
      limit: 30,
    })
    expect(shown).toHaveLength(30)
    expect(hidden).toBe(10)
    expect(
      previewCharacters(list, { expanded: false, narrowed: false, limit: 12 })
        .hidden
    ).toBe(28)
  })

  it("shows every one once expanded, narrowed by a search or filter, or within the limit", () => {
    for (const options of [
      { expanded: true, narrowed: false, limit: 30 },
      { expanded: false, narrowed: true, limit: 30 },
      { expanded: false, narrowed: false, limit: 40 },
    ]) {
      expect(previewCharacters(list, options)).toEqual({
        shown: list,
        hidden: 0,
      })
    }
  })
})

describe("deployedZones", () => {
  it("names the zone of each deployed unit's last attack, MoWs too", () => {
    const attack = (zoneId: string, ids: string[], mow: string | null) =>
      ({
        zoneId,
        characters: ids.map((unitId) => ({ unitId })),
        mow: mow ? { unitId: mow } : null,
      }) as unknown as Parameters<typeof deployedZones>[0][number]
    expect(
      deployedZones([
        attack("Armoury", ["a", "b"], "m"),
        attack("Bunker1", ["c"], null),
      ])
    ).toEqual(
      new Map([
        ["a", "Armoury"],
        ["b", "Armoury"],
        ["m", "Armoury"],
        ["c", "Bunker1"],
      ])
    )
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
