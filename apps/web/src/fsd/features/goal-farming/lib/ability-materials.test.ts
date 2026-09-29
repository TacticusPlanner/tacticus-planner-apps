import { describe, expect, it } from "vitest"
import { unitIdSchema } from "@workspace/game-domain"
import type {
  CharacterAbilityCostStorageModel,
  MowStorageModel,
  MowUpgradeCostStorageModel,
} from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"

import {
  calculateGoalResourceNeed,
  createUnitCoverage,
  type GoalRequirementParams,
} from "./goal-requirements"

const characterLadder = new Map(
  [
    [2, 10, "Common", 1],
    [3, 20, "Common", 2],
    [4, 30, "Common", 3],
    [5, 40, "Uncommon", 4],
  ].map(([level, gold, rarity, amount]) => [
    level as number,
    {
      id: String(level),
      level,
      gold,
      badges: { rarity, amount },
    } as CharacterAbilityCostStorageModel,
  ])
)

const mowLadder = new Map(
  [
    [2, 100, 1, 1],
    [3, 200, 2, 2],
    [4, 300, 3, 3],
    [5, 400, 4, 4],
  ].map(([level, gold, amount, components]) => [
    level as number,
    {
      id: String(level),
      level,
      gold,
      salvage: 0,
      badges: { rarity: "Rare", amount },
      forgeBadges: { rarity: "Epic", amount: 1 },
      components,
    } as MowUpgradeCostStorageModel,
  ])
)

const mow = {
  id: unitIdSchema.parse("mowA"),
  primaryAbility: { name: "P", recipes: [] },
  secondaryAbility: { name: "S", recipes: [] },
} as unknown as MowStorageModel

function goal(
  entityType: "Character" | "Mow",
  ability: {
    activeStart: number
    activeEnd: number
    passiveStart: number
    passiveEnd: number
  }
) {
  return {
    goalType: "Ability",
    entityType,
    entityId: "unit",
    config: { farmingStrategy: "EveryStep", ability },
  } as GoalDetail
}

const base = {
  character: undefined,
  characterView: undefined,
  mow: undefined,
  playerCharacter: undefined,
  playerMow: undefined,
  inventoryShard: undefined,
  upgradesById: new Map(),
  ascensionCostsById: new Map(),
  unlockShardCostsById: new Map(),
} satisfies Omit<GoalRequirementParams, "detail">

const range = (activeStart: number, activeEnd: number) => ({
  activeStart,
  activeEnd,
  passiveStart: 1,
  passiveEnd: 1,
})

describe("MoW ability materials", () => {
  it("sums the ladder for levels 4 and 5 over a 3 -> 5 goal", () => {
    const need = calculateGoalResourceNeed({
      ...base,
      detail: goal("Mow", range(3, 5)),
      mow,
      mowUpgradeCostsByLevel: mowLadder,
    })

    expect(need?.abilityMaterials).toEqual({
      gold: 300 + 400,
      badgesByRarity: { Rare: 3 + 4 },
      forgeBadgesByRarity: { Epic: 2 },
      components: 3 + 4,
    })
  })

  it("sums both tracks", () => {
    const need = calculateGoalResourceNeed({
      ...base,
      detail: goal("Mow", {
        activeStart: 1,
        activeEnd: 2,
        passiveStart: 2,
        passiveEnd: 4,
      }),
      mow,
      mowUpgradeCostsByLevel: mowLadder,
    })

    // primary: level 2; secondary: levels 3 and 4
    expect(need?.abilityMaterials?.gold).toBe(100 + 200 + 300)
  })

  it("skips levels a higher-priority goal already covers", () => {
    const coverage = createUnitCoverage()
    const shared = {
      ...base,
      mow,
      mowUpgradeCostsByLevel: mowLadder,
      coveredAbilityTransitions: coverage,
    }
    calculateGoalResourceNeed({ ...shared, detail: goal("Mow", range(3, 4)) })

    const second = calculateGoalResourceNeed({
      ...shared,
      detail: goal("Mow", range(3, 5)),
    })

    // transition 3 -> 4 is covered, only 4 -> 5 (ladder level 5) remains
    expect(second?.abilityMaterials?.gold).toBe(400)
  })

  it("credits levels the player has already reached", () => {
    const need = calculateGoalResourceNeed({
      ...base,
      detail: goal("Mow", range(3, 5)),
      mow,
      playerMow: {
        abilities: [{ abilityId: "a", level: 4 }],
      } as GoalRequirementParams["playerMow"],
      mowUpgradeCostsByLevel: mowLadder,
    })

    expect(need?.abilityMaterials?.gold).toBe(400)
  })

  it("yields no abilityMaterials when the ladder is missing", () => {
    expect(
      calculateGoalResourceNeed({
        ...base,
        detail: goal("Mow", range(3, 5)),
        mow,
      })
    ).toBeNull()
    expect(
      calculateGoalResourceNeed({
        ...base,
        detail: goal("Mow", range(3, 5)),
        mow,
        mowUpgradeCostsByLevel: new Map(),
      })
    ).toBeNull()
  })
})

describe("Character ability materials", () => {
  const character = (
    activeStart: number,
    activeEnd: number,
    passiveStart = 1,
    passiveEnd = 1
  ) => goal("Character", { activeStart, activeEnd, passiveStart, passiveEnd })

  it("sums one track over the character ladder", () => {
    const need = calculateGoalResourceNeed({
      ...base,
      detail: character(2, 4),
      characterAbilityCostsByLevel: characterLadder,
    })

    expect(need?.abilityMaterials).toEqual({
      gold: 20 + 30,
      badgesByRarity: { Common: 2 + 3 },
      forgeBadgesByRarity: {},
      components: 0,
    })
  })

  it("sums both tracks and splits badges by rarity", () => {
    const need = calculateGoalResourceNeed({
      ...base,
      detail: character(1, 3, 3, 5),
      characterAbilityCostsByLevel: characterLadder,
    })

    // active: levels 2, 3; passive: levels 4, 5
    expect(need?.abilityMaterials).toEqual({
      gold: 10 + 20 + 30 + 40,
      badgesByRarity: { Common: 1 + 2 + 3, Uncommon: 4 },
      forgeBadgesByRarity: {},
      components: 0,
    })
  })

  it("skips a range covered by a higher-priority goal", () => {
    const coverage = createUnitCoverage()
    const shared = {
      ...base,
      characterAbilityCostsByLevel: characterLadder,
      coveredAbilityTransitions: coverage,
    }
    calculateGoalResourceNeed({ ...shared, detail: character(1, 3) })

    const second = calculateGoalResourceNeed({
      ...shared,
      detail: character(1, 4),
    })
    // 1 -> 3 covered; only 3 -> 4 (ladder level 4) remains
    expect(second?.abilityMaterials?.gold).toBe(30)

    const third = calculateGoalResourceNeed({
      ...shared,
      detail: character(1, 4),
    })
    expect(third).toBeNull()
  })

  it("yields no abilityMaterials when the ladder is missing", () => {
    expect(
      calculateGoalResourceNeed({ ...base, detail: character(2, 4) })
    ).toBeNull()
  })
})
