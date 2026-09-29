import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import {
  createAbilityMaterialsPlan,
  withStandaloneAvailable,
} from "./plan-ability-materials"

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

describe("createAbilityMaterialsPlan Machine of War available/needed", () => {
  const run = (inv: never, ...ids: string[]) => {
    const plan = createAbilityMaterialsPlan(
      { mowUpgradeCostsByLevel: ladder as never },
      inv
    )
    ids.forEach((id, i) =>
      plan.add(mow(id, `unit${i}`), { ...player, alliance: "Chaos" })
    )
    return plan.byGoalId
  }

  it("fully held: keeps the need and reports the stock (27/27)", () => {
    expect(run(inventory(138), "g1").get("g1")).toEqual({
      gold: 100,
      badgesByRarity: { Legendary: 27 },
      forgeBadgesByRarity: { Legendary: 27 },
      components: 138,
      available: {
        badgesByRarity: { Legendary: 27 },
        forgeBadgesByRarity: { Legendary: 27 },
        components: 138,
      },
    })
  })

  it("partly held: components 118/138", () => {
    const g1 = run(inventory(118), "g1").get("g1")
    expect(g1?.components).toBe(138)
    expect(g1?.available?.components).toBe(118)
  })

  it("priority split, uncapped: 30 held, 27 needed twice gives 30 then 3", () => {
    const inv = {
      ...(inventory(0) as object),
      abilityBadges: {
        imperial: [],
        xenos: [],
        chaos: [{ rarity: "Legendary", amount: 30 }],
      },
    } as never
    const byGoal = run(inv, "first", "second")
    expect(byGoal.get("first")?.available?.badgesByRarity).toEqual({
      Legendary: 30,
    })
    expect(byGoal.get("second")?.available?.badgesByRarity).toEqual({
      Legendary: 3,
    })
    expect(byGoal.get("second")?.badgesByRarity).toEqual({ Legendary: 27 })
  })

  it("does not list a resource the goal does not need", () => {
    const noForge = new Map([
      [2, { level: 2, gold: 5, badges: { rarity: "Legendary", amount: 1 } }],
    ])
    const plan = createAbilityMaterialsPlan(
      { mowUpgradeCostsByLevel: noForge as never },
      inventory(10)
    )
    plan.add(mow("g1"), { ...player, alliance: "Chaos" })
    expect(plan.byGoalId.get("g1")?.available?.forgeBadgesByRarity).toEqual({})
  })

  it("paused fallback: standalone need against the full stock", () => {
    const need = {
      gold: 100,
      badgesByRarity: { Legendary: 27 },
      forgeBadgesByRarity: {},
      components: 138,
    }
    expect(
      withStandaloneAvailable(need, inventory(118), "Chaos").available
    ).toEqual({
      badgesByRarity: { Legendary: 27 },
      forgeBadgesByRarity: {},
      components: 118,
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
