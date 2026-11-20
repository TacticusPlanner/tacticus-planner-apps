import { describe, expect, it } from "vitest"
import { progressionRarity } from "@workspace/game-domain"

import type { TeamRosterUnit } from "../model/use-team-roster"

import { capRosterUnit, underCap } from "./rarity-cap"

const unit = (patch: Partial<TeamRosterUnit> = {}): TeamRosterUnit => ({
  progression: "Epic:RedThreeStars",
  rank: "Gold1",
  xpLevel: 35,
  abilityLevels: [35, 35],
  ...patch,
})

describe("underCap", () => {
  it("finds nothing under the default Mythic cap", () => {
    expect(
      underCap(
        unit({ abilityLevels: [1, 1], xpLevel: 1 }),
        "Mythic",
        progressionRarity
      ).any
    ).toBe(false)
  })

  it("finds nothing for a unit at the Epic targets", () => {
    expect(underCap(unit(), "Epic", progressionRarity)).toEqual({
      rarity: false,
      rank: false,
      level: false,
      abilities: [false, false],
      any: false,
    })
  })

  it("marks the rarity, rank, level and abilities under the Epic targets", () => {
    expect(
      underCap(
        unit({
          progression: "Rare:RedOneStar",
          rank: "Silver3",
          xpLevel: 30,
          abilityLevels: [35, 20],
        }),
        "Epic",
        progressionRarity
      )
    ).toEqual({
      rarity: true,
      rank: true,
      level: true,
      abilities: [false, true],
      any: true,
    })
  })

  it("counts a unit at the cap's rank as there, whatever upgrades it has", () => {
    // Bronze 1 is Uncommon's rank: a unit on it is not under the cap's rank.
    expect(
      underCap(
        unit({
          progression: "Uncommon:FourStars",
          rank: "Bronze1",
          xpLevel: 17,
          abilityLevels: [17, 17],
        }),
        "Uncommon",
        progressionRarity
      ).any
    ).toBe(false)
  })

  it("compares a MoW, which has no rank or XP level, by rarity and abilities", () => {
    const result = underCap(
      unit({
        rank: undefined,
        xpLevel: 1,
        abilityLevels: [40, 40],
      }),
      "Epic",
      progressionRarity
    )
    expect(result.rank).toBe(false)
    expect(result.level).toBe(false)
    expect(result.any).toBe(false)
  })
})

describe("capRosterUnit", () => {
  it("shows a Legendary Diamond 3 unit at level 50 as Epic, Gold 1, level 35", () => {
    const capped = capRosterUnit(
      {
        progression: "Legendary:RedFiveStars",
        rank: "Diamond3",
        xpLevel: 50,
        abilityLevels: [50, 40],
      },
      "Epic",
      progressionRarity
    )
    expect(capped).toEqual({
      progression: "Epic:RedThreeStars",
      rank: "Gold1",
      xpLevel: 35,
      abilityLevels: [35, 35],
    })
  })

  it("leaves a unit at or below the cap as it is", () => {
    const unit = {
      progression: "Rare:FourStars" as const,
      rank: "Silver1" as const,
      abilityLevels: [20, 20] as [number, number],
    }
    expect(capRosterUnit(unit, "Epic", progressionRarity)).toBe(unit)
    expect(capRosterUnit(unit, "Mythic", progressionRarity)).toBe(unit)
  })

  it("caps a unit with no rank or XP level, and gives it neither", () => {
    const capped = capRosterUnit(
      { progression: "Legendary:RedFiveStars", abilityLevels: [50, 40] },
      "Epic",
      progressionRarity
    )
    expect(capped).toEqual({
      progression: "Epic:RedThreeStars",
      abilityLevels: [35, 35],
    })
    expect(capped.rank).toBeUndefined()
    expect(capped.xpLevel).toBeUndefined()
  })
})
