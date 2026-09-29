import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { createAbilityMaterialsPlan } from "./plan-ability-materials"

// A MoW ladder: level 2 costs 27 badges, 27 forge badges and 138 components.
const ladder = new Map([
  [
    2,
    {
      level: 2,
      gold: 100,
      badges: { rarity: "Legendary", amount: 27 },
      forgeBadges: { rarity: "Legendary", amount: 27 },
      components: 138,
    },
  ],
])
const mow = (goalId: string, entityId = "zkar") =>
  ({
    goalId,
    entityType: "Mow",
    entityId,
    goalType: "Ability",
    config: {
      ability: {
        activeStart: 1,
        activeEnd: 2,
        passiveStart: 1,
        passiveEnd: 1,
      },
    },
  }) as unknown as GoalDetail
const player = { playerCharacter: undefined, playerMow: undefined }
const inventory = (components: number) =>
  ({
    abilityBadges: {
      imperial: [],
      xenos: [],
      chaos: [{ rarity: "Legendary", amount: 27 }],
    },
    forgeBadges: [{ rarity: "Legendary", amount: 27 }],
    components: {
      imperial: { amount: 0 },
      xenos: { amount: 0 },
      chaos: { amount: components },
    },
  }) as never

describe("createAbilityMaterialsPlan inventory netting", () => {
  it("nets held badges, forge badges and components (the Z'Kar case) but never gold", () => {
    const plan = createAbilityMaterialsPlan(
      { mowUpgradeCostsByLevel: ladder as never },
      inventory(118)
    )
    plan.add(mow("g1"), { ...player, alliance: "Chaos" })
    expect(plan.byGoalId.get("g1")).toEqual({
      gold: 100,
      badgesByRarity: {},
      forgeBadgesByRarity: {},
      components: 20,
    })
  })

  it("lets the higher-priority goal take stock first", () => {
    const plan = createAbilityMaterialsPlan(
      { mowUpgradeCostsByLevel: ladder as never },
      inventory(200)
    )
    plan.add(mow("first", "zkar"), { ...player, alliance: "Chaos" })
    plan.add(mow("second", "other"), { ...player, alliance: "Chaos" })
    expect(plan.byGoalId.get("first")?.components).toBe(0)
    expect(plan.byGoalId.get("second")).toMatchObject({
      badgesByRarity: { Legendary: 27 },
      forgeBadgesByRarity: { Legendary: 27 },
      components: 138 - 62,
    })
  })

  it("leaves materials gross when no inventory is supplied", () => {
    const plan = createAbilityMaterialsPlan({
      mowUpgradeCostsByLevel: ladder as never,
    })
    plan.add(mow("g1"), { ...player, alliance: "Chaos" })
    expect(plan.byGoalId.get("g1")?.components).toBe(138)
  })
})
