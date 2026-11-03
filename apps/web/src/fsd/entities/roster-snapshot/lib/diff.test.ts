import { describe, expect, it } from "vitest"
import type { Progression } from "@workspace/game-domain"

import {
  contributesTo,
  diffRosters,
  summarizeRosterDiff,
  type DiffUnit,
  type RosterDiffContext,
} from "./diff"

const calgarFrom: DiffUnit = {
  unitId: "ultraCalgar",
  rank: "Diamond1",
  progressionIndex: "Legendary:RedFiveStars",
  appliedUpgradeSlots: [0, 1, 2, 3],
  xp: 100_000,
  xpLevel: 45,
  shards: 320,
  mythicShards: 0,
  abilities: [
    { abilityId: "CalgarActive", level: 40 },
    { abilityId: "CalgarPassive", level: 38 },
  ],
  equippedItems: [],
}

const calgarTo: DiffUnit = {
  ...calgarFrom,
  rank: "Diamond3",
  progressionIndex: "Legendary:OneBlueStar",
  appliedUpgradeSlots: [0],
  xp: 130_000,
  xpLevel: 48,
  shards: 80,
  abilities: [
    { abilityId: "CalgarActive", level: 45 },
    { abilityId: "CalgarPassive", level: 38 },
  ],
}

const stepCosts: Partial<
  Record<Progression, { shards: number; mythicShards: number }>
> = {
  "Legendary:OneBlueStar": { shards: 500, mythicShards: 0 },
  "Common:OneStar": { shards: 10, mythicShards: 0 },
  "Common:TwoStars": { shards: 15, mythicShards: 0 },
  "Mythic:TwoBlueStars": { shards: 0, mythicShards: 50 },
}

const context: RosterDiffContext = {
  initialRarity: () => "Common",
  unlockShards: (rarity) => (rarity === "Common" ? 40 : undefined),
  stepCost: (progression) => stepCosts[progression],
}

describe("diffRosters", () => {
  it("computes the Calgar worked example", () => {
    const [diff] = diffRosters(
      { characters: [calgarFrom] },
      { characters: [calgarTo] },
      context
    )
    expect(diff).toMatchObject({
      unitId: "ultraCalgar",
      kind: "character",
      unlocked: false,
      changed: true,
      rank: { from: "Diamond1", to: "Diamond3" },
      progression: {
        from: "Legendary:RedFiveStars",
        to: "Legendary:OneBlueStar",
      },
      xpLevel: { from: 45, to: 48 },
      xpGained: 30_000,
      // The rank changed, so applied upgrades are not compared.
      upgrades: null,
      shards: { from: 320, to: 80, net: -240, spent: 500, earned: 260 },
      abilities: [{ slot: 0, abilityId: "CalgarActive", from: 40, to: 45 }],
      equipment: [],
    })
  })

  it("leaves an identical unit unchanged", () => {
    const [diff] = diffRosters(
      { characters: [calgarFrom] },
      { characters: [calgarFrom] },
      context
    )
    expect(diff?.changed).toBe(false)
    expect(diff?.shards).toMatchObject({ net: 0, spent: 0, earned: 0 })
  })

  it("ignores values that went down, except shards", () => {
    const [diff] = diffRosters(
      { characters: [calgarTo] },
      { characters: [{ ...calgarFrom, shards: 10 }] },
      context
    )
    expect(diff).toMatchObject({
      rank: null,
      progression: null,
      xpLevel: null,
      xpGained: null,
      abilities: [],
      shards: { net: -70, spent: 0, earned: -70 },
      changed: true,
    })
  })

  it("compares applied upgrades at the same rank", () => {
    const [diff] = diffRosters(
      { characters: [calgarFrom] },
      { characters: [{ ...calgarFrom, appliedUpgradeSlots: [0, 1, 2, 3, 4] }] }
    )
    expect(diff?.upgrades).toEqual({ from: 4, to: 5 })
  })

  it("counts an unlock's cost and the steps from the starting progression", () => {
    const [diff] = diffRosters(
      { characters: [] },
      {
        characters: [
          {
            unitId: "ultraTitus",
            rank: "Stone1",
            progressionIndex: "Common:TwoStars",
            shards: 5,
            mythicShards: 0,
          },
        ],
      },
      context
    )
    expect(diff).toMatchObject({
      unlocked: true,
      changed: true,
      progression: null,
      rank: null,
      abilities: [],
      shards: { from: 0, to: 5, net: 5, spent: 40 + 10 + 15, earned: 70 },
    })
  })

  it("counts mythic shards on mythic steps", () => {
    const [diff] = diffRosters(
      {
        mows: [
          {
            unitId: "mow",
            progressionIndex: "Mythic:OneBlueStar",
            mythicShards: 60,
          },
        ],
      },
      {
        mows: [
          {
            unitId: "mow",
            progressionIndex: "Mythic:TwoBlueStars",
            mythicShards: 20,
          },
        ],
      },
      context
    )
    expect(diff?.kind).toBe("mow")
    expect(diff?.mythicShards).toEqual({
      from: 60,
      to: 20,
      net: -40,
      spent: 50,
      earned: 10,
    })
  })

  it("lists equipment slots whose item changed or level rose", () => {
    const [diff] = diffRosters(
      {
        characters: [
          {
            ...calgarFrom,
            equippedItems: [
              { slotId: "Slot1", equipmentId: "a", level: 1 },
              { slotId: "Slot2", equipmentId: "b", level: 3 },
              { slotId: "Slot3", equipmentId: "c", level: 2 },
            ],
          },
        ],
      },
      {
        characters: [
          {
            ...calgarFrom,
            equippedItems: [
              { slotId: "Slot1", equipmentId: "a", level: 2 },
              { slotId: "Slot2", equipmentId: "b", level: 3 },
              { slotId: "Slot3", equipmentId: "d", level: 1 },
            ],
          },
        ],
      }
    )
    expect(diff?.equipment).toEqual([
      {
        slotId: "Slot1",
        from: { equipmentId: "a", level: 1 },
        to: { equipmentId: "a", level: 2 },
      },
      {
        slotId: "Slot3",
        from: { equipmentId: "c", level: 2 },
        to: { equipmentId: "d", level: 1 },
      },
    ])
  })

  it("omits units owned only in from, and computes power from zero on unlock", () => {
    const diffs = diffRosters(
      { characters: [calgarFrom] },
      {
        characters: [
          {
            unitId: "ultraTitus",
            rank: "Stone1",
            progressionIndex: "Common:None",
          },
        ],
      },
      { power: (_kind, unit) => (unit.unitId === "ultraTitus" ? 1200 : 0) }
    )
    expect(diffs).toHaveLength(1)
    expect(diffs[0]?.power).toEqual({ from: 0, to: 1200, delta: 1200 })
  })

  it("has no power change when a side cannot be computed", () => {
    const [diff] = diffRosters(
      { characters: [calgarFrom] },
      { characters: [calgarTo] },
      { power: (_kind, unit) => (unit === calgarFrom ? null : 5000) }
    )
    expect(diff?.power).toBeNull()
  })
})

describe("diffRosters with a V1 import", () => {
  it("treats total XP, applied upgrades and MoW XP levels as unknown", () => {
    const mow: DiffUnit = {
      unitId: "mow",
      progressionIndex: "Epic:RedOneStar",
      xp: 0,
      xpLevel: 0,
    }
    const [calgar, machine] = diffRosters(
      { characters: [calgarFrom], mows: [mow], progressUnknown: true },
      {
        characters: [calgarTo],
        mows: [{ ...mow, xp: 5000, xpLevel: 20 }],
      }
    )

    expect(calgar?.xpGained).toBeNull()
    expect(calgar?.upgrades).toBeNull()
    // A character's XP level was recorded, so it still compares.
    expect(calgar?.xpLevel).toEqual({ from: 45, to: 48 })
    expect(machine?.xpLevel).toBeNull()
    expect(machine?.changed).toBe(false)
  })
})

describe("summarizeRosterDiff", () => {
  it("counts the two-unit worked example", () => {
    const diffs = diffRosters(
      { characters: [calgarFrom] },
      {
        characters: [
          {
            ...calgarTo,
            abilities: [
              { abilityId: "CalgarActive", level: 45 },
              { abilityId: "CalgarPassive", level: 38 },
            ],
          },
          {
            unitId: "ultraTitus",
            rank: "Stone1",
            progressionIndex: "Common:None",
          },
        ],
      }
    )
    expect(summarizeRosterDiff(diffs)).toMatchObject({
      unlocked: 1,
      ascensions: 0,
      promotions: 1,
      rankUps: 2,
      abilityLevels: 5,
      upgradesApplied: 0,
    })
  })

  it("counts an ascension separately from promotions", () => {
    const diffs = diffRosters(
      {
        characters: [{ ...calgarFrom, progressionIndex: "Epic:RedThreeStars" }],
      },
      {
        characters: [
          { ...calgarFrom, progressionIndex: "Legendary:RedFourStars" },
        ],
      }
    )
    expect(summarizeRosterDiff(diffs)).toMatchObject({
      ascensions: 1,
      promotions: 1,
    })
  })

  it("tells which units contribute to a metric", () => {
    const [calgar] = diffRosters(
      { characters: [calgarFrom] },
      { characters: [calgarTo] }
    )
    expect(calgar && contributesTo(calgar, "rankUps")).toBe(true)
    expect(calgar && contributesTo(calgar, "unlocked")).toBe(false)
  })
})
