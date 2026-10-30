import { progressionAt, rankAt } from "@workspace/game-domain"
import type { GameCatalogGuildRaidMetaRecommendation } from "@workspace/game-catalog"
import { describe, expect, it } from "vitest"

import type { GuildRaidInvestmentFacts } from "./resolve-guild-raid-investment-readiness"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"
import {
  resolveGuildRaidLineup,
  type GuildRaidReadinessRoster,
} from "./resolve-guild-raid-lineup"

const requiredIndex = 10
const requiredAbilityLevel = 20

const threshold: GuildRaidInvestmentThreshold = {
  progression: progressionAt(requiredIndex),
  requiredRank: rankAt(requiredIndex),
  requiredRankIndex: requiredIndex,
  requiredProgressionIndex: requiredIndex,
  requiredAbilityLevel,
}

/** Investment scoring `percent` on every dimension, so the hero's readiness is exactly `percent`. */
function invested(percent: number): GuildRaidInvestmentFacts {
  const index = (requiredIndex * percent) / 100
  return {
    rank: rankAt(index),
    progression: progressionAt(index),
    activeAbilityLevel: (requiredAbilityLevel * percent) / 100,
    passiveAbilityLevel: (requiredAbilityLevel * percent) / 100,
  }
}

function roster(
  characters: Record<string, number>,
  mows: Record<string, number> = {}
): GuildRaidReadinessRoster {
  return {
    ownedCharacterIds: new Set(Object.keys(characters)),
    ownedMowIds: new Set(Object.keys(mows)),
    investmentByCharacterId: new Map(
      Object.entries(characters).map(([id, percent]) => [id, invested(percent)])
    ),
    investmentByMowId: new Map(
      Object.entries(mows).map(([id, percent]) => [id, invested(percent)])
    ),
  }
}

// Mirrors the curated Tervigon "alternate" lineup: Blackmane is both a flex ideal and an authored
// substitute for two other slots.
const recommendation: GameCatalogGuildRaidMetaRecommendation = {
  id: "Boss1-alternate",
  kind: "alternate",
  heroSlots: [
    {
      heroId: "bladeChampion",
      roleId: "signature",
      essential: true,
      replacementCharacterIds: [],
    },
    {
      heroId: "trajann",
      roleId: "core",
      essential: true,
      replacementCharacterIds: ["blackmane", "dante"],
    },
    {
      heroId: "kharn",
      roleId: "core",
      essential: true,
      replacementCharacterIds: ["blackmane", "dante"],
    },
    {
      heroId: "blackmane",
      roleId: "flex",
      essential: false,
      replacementCharacterIds: ["dante", "mephiston"],
    },
    {
      heroId: "helbrecht",
      roleId: "flex",
      essential: false,
      replacementCharacterIds: ["blackmane", "dante"],
    },
  ],
  mowId: "galatian",
  mowReplacementIds: ["crawler", "biovore"],
  compIds: [],
  efficiency: 1,
}

describe("resolveGuildRaidLineup", () => {
  it("fills unowned slots with free substitutes and explains every option", () => {
    const lineup = resolveGuildRaidLineup({
      recommendation,
      roster: roster(
        { bladeChampion: 90, kharn: 70, blackmane: 80, dante: 60 },
        { crawler: 30, biovore: 60 }
      ),
      threshold,
    })

    expect(lineup.status).toBe("substitutes")
    expect(lineup.slots.map((slot) => slot.pickedUnitId)).toEqual([
      "bladeChampion",
      "dante",
      "kharn",
      "blackmane",
      null,
      "biovore",
    ])
    expect(lineup.slots.map((slot) => slot.readiness)).toEqual([
      90, 60, 70, 80, 0, 60,
    ])

    const trajannSlot = lineup.slots[1]!
    expect(trajannSlot.isSubstitute).toBe(true)
    expect(trajannSlot.options).toEqual([
      expect.objectContaining({
        unitId: "trajann",
        isIdeal: true,
        state: "notOwned",
      }),
      // Blackmane is owned and the flex slot's own ideal, so it stays locked there.
      expect.objectContaining({
        unitId: "blackmane",
        state: "inTeam",
        inTeamSlotIndex: 3,
        readiness: 80,
      }),
      expect.objectContaining({
        unitId: "dante",
        state: "picked",
        readiness: 60,
      }),
    ])

    const helbrechtSlot = lineup.slots[4]!
    expect(helbrechtSlot.isSubstitute).toBe(false)
    expect(helbrechtSlot.options.map((option) => option.state)).toEqual([
      "notOwned",
      "inTeam",
      "inTeam",
    ])

    const mowSlot = lineup.slots[5]!
    expect(mowSlot).toMatchObject({ kind: "mow", isSubstitute: true })
    expect(mowSlot.roleId).toBeUndefined()
    expect(mowSlot.options.map((option) => option.state)).toEqual([
      "notOwned",
      "available",
      "picked",
    ])
  })

  it("is ready only when every slot, Machine of War included, holds its ideal unit", () => {
    const owned = {
      bladeChampion: 100,
      trajann: 100,
      kharn: 100,
      blackmane: 100,
      helbrecht: 100,
    }

    expect(
      resolveGuildRaidLineup({
        recommendation,
        roster: roster(owned, { galatian: 100 }),
        threshold,
      })
    ).toMatchObject({ status: "ready", teamReadiness: 100 })

    expect(
      resolveGuildRaidLineup({
        recommendation,
        roster: roster(owned, { biovore: 100 }),
        threshold,
      }).status
    ).toBe("substitutes")
  })

  it("reports missing essentials when an essential slot has no owned option", () => {
    const lineup = resolveGuildRaidLineup({
      recommendation,
      roster: roster({ trajann: 100, kharn: 100, blackmane: 100 }),
      threshold,
    })

    expect(lineup.status).toBe("missingEssentials")
    expect(lineup.slots[0]!.pickedUnitId).toBeNull()
  })

  it("weights the picked substitute's readiness into the team score", () => {
    const withSubstitute = resolveGuildRaidLineup({
      recommendation,
      roster: roster({ bladeChampion: 100, kharn: 100, dante: 50 }),
      threshold,
    })
    const withoutSubstitute = resolveGuildRaidLineup({
      recommendation,
      roster: roster({ bladeChampion: 100, kharn: 100 }),
      threshold,
    })

    expect(withSubstitute.teamReadiness).toBeGreaterThan(
      withoutSubstitute.teamReadiness!
    )
  })

  it("still picks substitutes in authored order but withholds percentages without a threshold", () => {
    const lineup = resolveGuildRaidLineup({
      recommendation,
      roster: roster(
        { bladeChampion: 90, kharn: 70, dante: 10, mephiston: 90 },
        { crawler: 10, biovore: 90 }
      ),
      threshold: null,
    })

    expect(lineup.teamReadiness).toBeUndefined()
    expect(lineup.slots.every((slot) => slot.readiness === undefined)).toBe(
      true
    )
    expect(
      lineup.slots[0]!.options.every((option) => option.readiness === undefined)
    ).toBe(true)
    expect(lineup.slots.map((slot) => slot.pickedUnitId)).toEqual([
      "bladeChampion",
      "dante",
      "kharn",
      "mephiston",
      null,
      "crawler",
    ])
  })

  it("picks the highest-readiness owned Machine of War substitute", () => {
    const lineup = resolveGuildRaidLineup({
      recommendation,
      roster: roster({}, { crawler: 30, biovore: 60 }),
      threshold,
    })

    expect(lineup.slots[5]).toMatchObject({
      pickedUnitId: "biovore",
      readiness: 60,
    })
  })
})
