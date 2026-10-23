import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import {
  computeLevelRequirementProgress,
  levelPotentialRatio,
} from "./level-requirement-progress"

// Bellator's Silver3 needs level 32 in the rank-level ladder; an Ability target's level is the higher of
// its two tracks (they share one scale with character levels).
const rankDetail = {
  status: "Active",
  entityType: "Character",
  goalType: "Rank",
  config: {
    rank: {
      start: 5,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 11, // Silver3
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
} as unknown as GoalDetail

function abilityDetail(activeEnd: number, passiveEnd: number) {
  return {
    status: "Active",
    entityType: "Character",
    goalType: "Ability",
    config: {
      ability: { activeStart: 1, activeEnd, passiveStart: 1, passiveEnd },
    },
  } as unknown as GoalDetail
}

const mythic = "Mythic:MythicWings"

describe("computeLevelRequirementProgress", () => {
  it("shows the required level, current level, and raw XP gap for a Rank goal below its level", () => {
    // Level 32's total-XP threshold is 94,200; 82,000 gained → 12,200 XP to go.
    expect(
      computeLevelRequirementProgress({
        detail: rankDetail,
        playerUnit: { xpLevel: 31, xp: 82_000, progressionIndex: mythic },
      })
    ).toMatchObject({
      kind: "LevelRequirement",
      current: 31,
      target: 32,
      remainingXp: 12_200,
      reachableRatio: null,
      reachableLevel: null,
    })
  })

  it("shows nothing for a goal that is no longer in flight", () => {
    const playerUnit = { xpLevel: 31, xp: 82_000, progressionIndex: mythic }
    for (const status of ["Completed", "Archived"]) {
      expect(
        computeLevelRequirementProgress({
          detail: { ...rankDetail, status } as GoalDetail,
          playerUnit,
        })
      ).toBeNull()
    }
  })

  it("derives an Ability goal's requirement from its higher track", () => {
    expect(
      computeLevelRequirementProgress({
        detail: abilityDetail(20, 35),
        playerUnit: { xpLevel: 30, xp: 72_200, progressionIndex: mythic },
      })
    ).toMatchObject({ kind: "LevelRequirement", current: 30, target: 35 })
  })

  it("is absent once the character's level is sufficient", () => {
    expect(
      computeLevelRequirementProgress({
        detail: rankDetail,
        playerUnit: { xpLevel: 32, xp: 94_200, progressionIndex: mythic },
      })
    ).toBeNull()
  })

  it("is absent for a unit that isn't owned, a Mow, and every other goal kind", () => {
    expect(
      computeLevelRequirementProgress({
        detail: rankDetail,
        playerUnit: undefined,
      })
    ).toBeNull()
    expect(
      computeLevelRequirementProgress({
        detail: { ...abilityDetail(20, 35), entityType: "Mow" } as GoalDetail,
        playerUnit: { xpLevel: 1, xp: 0, progressionIndex: mythic },
      })
    ).toBeNull()
    expect(
      computeLevelRequirementProgress({
        detail: {
          entityType: "Character",
          goalType: "Ascension",
          config: {},
        } as GoalDetail,
        playerUnit: { xpLevel: 1, xp: 0, progressionIndex: mythic },
      })
    ).toBeNull()
  })

  it("marks the rarity's level cap as the reachable ceiling when it falls below the requirement", () => {
    // Rare's level cap is 26 (levelCapByRarity.Rare); the requirement is level 32, on a 1..32 scale.
    expect(
      computeLevelRequirementProgress({
        detail: rankDetail,
        playerUnit: { xpLevel: 5, xp: 0, progressionIndex: "Rare:FourStars" },
      })
    ).toMatchObject({
      reachableRatio: (26 - 1) / (32 - 1),
      reachableLevel: 26,
    })
  })
})

describe("levelPotentialRatio", () => {
  it("reads 0% when owned books get a near-target character no further, not its absolute level position", () => {
    // A level-44 character on a 1..50 ladder reads ~88% on the absolute scale
    // (levelRequirementRatio(44, 50) = 43/49), but zero owned books means zero potential gain —
    // the bug this function fixes (show-xp-book-availability-per-goal).
    expect(levelPotentialRatio(44, 44, 50)).toBe(0)
  })

  it("reads 100% when owned books fully close the remaining gap", () => {
    expect(levelPotentialRatio(31, 32, 32)).toBe(1)
  })

  it("reads the fraction of the remaining gap owned books partially close", () => {
    // Halfway from 44 to 50 is level 47.
    expect(levelPotentialRatio(44, 47, 50)).toBeCloseTo(0.5)
  })

  it("is 1 when currentLevel already meets requiredLevel (nothing left to gain)", () => {
    expect(levelPotentialRatio(50, 50, 50)).toBe(1)
  })
})
