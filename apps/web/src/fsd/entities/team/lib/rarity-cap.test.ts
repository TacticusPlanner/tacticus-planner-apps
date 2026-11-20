import { describe, expect, it } from "vitest"
import { progressionRarity } from "@workspace/game-domain"

import type { TeamRosterUnit } from "../model/use-team-roster"

import { underCap } from "./rarity-cap"

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
