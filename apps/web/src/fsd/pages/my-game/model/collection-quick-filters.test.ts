import { describe, expect, it } from "vitest"
import type { AscensionCostStorageModel } from "@workspace/game-catalog"
import type { Progression, Rarity } from "@workspace/game-domain"

import {
  ascensionLadder,
  abilitiesBehindLevel,
  blueStarReady,
  canAscend,
  missingEquipment,
  needToAscend,
  needToLevel,
  orbsForAlliance,
  type QuickFilterUnit,
} from "./collection-quick-filters"

// The ladder from the spec's assumption line (shards, mythic shards, orbs and their rarity per step).
const step = (
  progression: Progression,
  shards: number,
  mythicShards: number,
  orbs: number,
  orbRarity: Rarity | null
) =>
  ({
    id: progression,
    progression,
    shards,
    mythicShards,
    orbs,
    orbRarity,
  }) as AscensionCostStorageModel
const ladder = ascensionLadder([
  step("Common:OneStar", 10, 0, 0, null),
  step("Common:TwoStars", 15, 0, 0, null),
  step("Uncommon:TwoStars", 15, 0, 10, "Uncommon"),
  step("Uncommon:ThreeStars", 15, 0, 0, null),
  step("Uncommon:FourStars", 15, 0, 0, null),
  step("Rare:FourStars", 20, 0, 10, "Rare"),
  step("Rare:FiveStars", 30, 0, 0, null),
  step("Rare:RedOneStar", 40, 0, 0, null),
  step("Epic:RedOneStar", 50, 0, 10, "Epic"),
  step("Epic:RedTwoStars", 65, 0, 0, null),
  step("Epic:RedThreeStars", 85, 0, 0, null),
  step("Legendary:RedThreeStars", 100, 0, 10, "Legendary"),
  step("Legendary:RedFourStars", 150, 0, 10, "Legendary"),
  step("Legendary:RedFiveStars", 250, 0, 15, "Legendary"),
  step("Legendary:OneBlueStar", 500, 0, 20, "Legendary"),
  step("Mythic:OneBlueStar", 0, 20, 10, "Mythic"),
  step("Mythic:TwoBlueStars", 0, 30, 10, "Mythic"),
  step("Mythic:ThreeBlueStars", 0, 50, 15, "Mythic"),
  step("Mythic:MythicWings", 0, 100, 25, "Mythic"),
])

const character = (
  overrides: Partial<QuickFilterUnit> & Pick<QuickFilterUnit, "progression">
): QuickFilterUnit => ({
  kind: "character",
  rank: "Stone1",
  xpLevel: 1,
  shards: 0,
  mythicShards: 0,
  ...overrides,
})

describe("canAscend", () => {
  const titus = (shards: number) =>
    character({ progression: "Epic:RedOneStar", shards })

  it("Titus pays 65 + 85 + 100 = 250 shards and 10 Legendary orbs to reach Legendary", () => {
    expect(canAscend(titus(260), ladder, { Legendary: 10 })).toBe(true)
    expect(canAscend(titus(240), ladder, { Legendary: 10 })).toBe(false)
    expect(canAscend(titus(260), ladder, { Legendary: 9 })).toBe(false)
  })

  it("from Legendary also needs 20 mythic shards, 35 Legendary and 10 Mythic orbs", () => {
    const unit = (mythicShards: number) =>
      character({
        progression: "Legendary:RedFourStars",
        shards: 800,
        mythicShards,
      })
    const orbs = { Legendary: 40, Mythic: 10 }
    expect(canAscend(unit(15), ladder, orbs)).toBe(false)
    expect(canAscend(unit(20), ladder, orbs)).toBe(true)
    expect(canAscend(unit(20), ladder, { Legendary: 34, Mythic: 10 })).toBe(
      false
    )
  })

  it("within Mythic targets the next Mythic step", () => {
    const unit = character({
      progression: "Mythic:OneBlueStar",
      mythicShards: 35,
    })
    expect(canAscend(unit, ladder, { Mythic: 10 })).toBe(true)
    expect(canAscend(unit, ladder, { Mythic: 9 })).toBe(false)
  })

  it("never lists a unit at Mythic wings", () => {
    const unit = character({
      progression: "Mythic:MythicWings",
      mythicShards: 1000,
    })
    expect(canAscend(unit, ladder, { Mythic: 1000 })).toBe(false)
  })

  it("applies to Machines of War along the same ladder", () => {
    const mow: QuickFilterUnit = {
      kind: "mow",
      progression: "Epic:RedOneStar",
      shards: 250,
      mythicShards: 0,
    }
    expect(canAscend(mow, ladder, { Legendary: 10 })).toBe(true)
  })

  it("does not cover a path with a step missing from the ladder", () => {
    const partial = ascensionLadder([step("Epic:RedTwoStars", 65, 0, 0, null)])
    expect(canAscend(titus(1000), partial, { Legendary: 100 })).toBe(false)
  })
})

describe("blueStarReady", () => {
  const unit = character({
    progression: "Legendary:RedThreeStars",
    shards: 900,
  })

  it("pays 150 + 250 + 500 = 900 shards and 10 + 15 + 20 = 45 Legendary orbs", () => {
    expect(blueStarReady(unit, ladder, { Legendary: 45 })).toBe(true)
    expect(blueStarReady(unit, ladder, { Legendary: 44 })).toBe(false)
    expect(
      blueStarReady({ ...unit, shards: 899 }, ladder, { Legendary: 45 })
    ).toBe(false)
  })

  it("never lists a unit already at one blue star or Mythic", () => {
    const plenty = { Legendary: 1000, Mythic: 1000 }
    for (const progression of [
      "Legendary:OneBlueStar",
      "Mythic:OneBlueStar",
      "Mythic:MythicWings",
    ] as const) {
      expect(
        blueStarReady(
          character({ progression, shards: 5000, mythicShards: 500 }),
          ladder,
          plenty
        )
      ).toBe(false)
    }
  })
})

describe("needToAscend and needToLevel", () => {
  const atCap = character({
    progression: "Epic:RedTwoStars",
    rank: "Gold1",
    xpLevel: 35,
  })
  const belowCap = character({
    progression: "Epic:RedTwoStars",
    rank: "Silver3",
    xpLevel: 30,
  })

  it("an Epic character at Gold 1 needs to ascend, not to level", () => {
    expect(needToAscend(atCap)).toBe(true)
    expect(needToLevel(atCap)).toBe(false)
  })

  it("an Epic character at Silver 3 below level 35 needs to level, not to ascend", () => {
    expect(needToAscend(belowCap)).toBe(false)
    expect(needToLevel(belowCap)).toBe(true)
    expect(needToLevel({ ...belowCap, xpLevel: 35 })).toBe(false)
  })

  it("a Mythic character at Adamantine 2 needs to ascend until Mythic wings", () => {
    expect(
      needToAscend(
        character({ progression: "Mythic:TwoBlueStars", rank: "Adamantine2" })
      )
    ).toBe(true)
    expect(
      needToAscend(
        character({ progression: "Mythic:MythicWings", rank: "Adamantine2" })
      )
    ).toBe(false)
  })

  it("never lists a Machine of War", () => {
    const mow: QuickFilterUnit = {
      kind: "mow",
      progression: "Epic:RedTwoStars",
      shards: 0,
      mythicShards: 0,
    }
    expect(needToAscend(mow)).toBe(false)
    expect(needToLevel(mow)).toBe(false)
  })
})

describe("orbsForAlliance", () => {
  const orbs = {
    imperial: [{ rarity: "Legendary" as const, amount: 10 }],
    chaos: [{ rarity: "Legendary" as const, amount: 50 }],
    xenos: [
      { rarity: "Mythic" as const, amount: 4 },
      { rarity: "Epic" as const, amount: 7 },
    ],
  }

  it("reads the unit's own alliance bucket", () => {
    expect(orbsForAlliance(orbs, "Imperial")).toEqual({ Legendary: 10 })
    expect(orbsForAlliance(orbs, "Chaos")).toEqual({ Legendary: 50 })
    expect(orbsForAlliance(orbs, "Xenos")).toEqual({ Mythic: 4, Epic: 7 })
  })

  it("does not count another alliance's orbs", () => {
    const imperial = character({
      progression: "Epic:RedOneStar",
      shards: 260,
    })
    const noImperialOrbs = { ...orbs, imperial: [] }
    expect(
      canAscend(imperial, ladder, orbsForAlliance(noImperialOrbs, "Imperial"))
    ).toBe(false)
  })

  it("holds nothing for an alliance with no orb inventory or no synced inventory", () => {
    expect(orbsForAlliance(orbs, "Neutral")).toEqual({})
    expect(orbsForAlliance(undefined, "Imperial")).toEqual({})
  })
})

describe("missingEquipment and abilitiesBehindLevel", () => {
  const owned = character({
    progression: "Legendary:RedThreeStars",
    xpLevel: 45,
    abilityLevels: [45, 40],
    equipped: 2,
    equipmentSlots: 3,
  })

  it("lists a character with an empty slot or an ability below its level", () => {
    expect(missingEquipment(owned)).toBe(true)
    expect(abilitiesBehindLevel(owned)).toBe(true)
  })

  it("does not list a fully equipped character with abilities at its level", () => {
    const done = { ...owned, abilityLevels: [45, 45], equipped: 3 }
    expect(missingEquipment(done)).toBe(false)
    expect(abilitiesBehindLevel(done)).toBe(false)
  })

  it("never lists a Machine of War", () => {
    const mow: QuickFilterUnit = {
      kind: "mow",
      progression: "Legendary:RedThreeStars",
      shards: 0,
      mythicShards: 0,
    }
    expect(missingEquipment(mow)).toBe(false)
    expect(abilitiesBehindLevel(mow)).toBe(false)
  })
})
