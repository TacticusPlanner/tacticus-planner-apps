import { describe, expect, it } from "vitest"

import type { LevelRules } from "@/entities/goal-farming"

import { createPlanMissingResources } from "./plan-missing-resources"

const levelRules = {
  xpBooks: { Legendary: { xp: 12_500 }, Epic: { xp: 2500 } },
} as unknown as LevelRules

describe("createPlanMissingResources", () => {
  it("sums net Character badges by alliance and a Machine of War's shortfall against its stock", () => {
    const plan = createPlanMissingResources()
    plan.addAbilityMaterials(
      {
        gold: 100,
        badgesByRarity: { Rare: 3 },
        forgeBadgesByRarity: {},
        components: 0,
      },
      "Imperial"
    )
    plan.addAbilityMaterials(
      {
        gold: 0,
        badgesByRarity: { Rare: 2, Epic: 4 },
        forgeBadgesByRarity: { Epic: 5 },
        components: 6,
        available: {
          badgesByRarity: { Rare: 5, Epic: 1 },
          forgeBadgesByRarity: { Epic: 2 },
          components: 10,
        },
      },
      "Imperial"
    )
    plan.addAbilityMaterials(null, "Xenos")

    const missing = plan.resolve(undefined, null)
    expect(missing.abilityBadges).toEqual({
      Imperial: { Rare: 3, Epic: 3 },
    })
    expect(missing.forgeBadges).toEqual({ Epic: 3 })
    expect(missing.components).toEqual({})
  })

  it("reads each goal's orb shortfall by alliance", () => {
    const plan = createPlanMissingResources()
    plan.addOrbAllocation({
      goalId: "a",
      stages: [
        {
          remaining: [
            { id: "orb:xenos:Epic", count: 4 },
            { id: "orb:chaos:Rare", count: 0 },
          ],
        },
      ],
    } as never)
    plan.addOrbAllocation({
      goalId: "b",
      stages: [{ remaining: [{ id: "orb:xenos:Epic", count: 1 }] }],
    } as never)
    plan.addOrbAllocation(undefined)

    expect(plan.resolve(undefined, null).orbs).toEqual({ Xenos: { Epic: 5 } })
  })

  it("prices the missing XP in whole books of the selected rarity", () => {
    const plan = createPlanMissingResources()
    plan.addXp(10_000)
    plan.addXp(3000)
    plan.addXp(undefined)

    expect(plan.resolve(levelRules, "Epic")).toMatchObject({
      xp: 13_000,
      xpBooks: { rarity: "Epic", count: 6 },
    })
    expect(plan.resolve(undefined, "Epic").xpBooks).toBeNull()
  })

  it("keeps each item's gross need beside the same shortfall", () => {
    const plan = createPlanMissingResources()
    plan.addAbilityMaterials(
      {
        gold: 0,
        badgesByRarity: { Rare: 2, Epic: 4 },
        forgeBadgesByRarity: { Epic: 5 },
        components: 6,
        available: {
          badgesByRarity: { Rare: 5, Epic: 1 },
          forgeBadgesByRarity: { Epic: 2 },
          components: 10,
        },
      },
      "Imperial"
    )
    plan.addOrbAllocation({
      goalId: "a",
      stages: [
        {
          needs: [{ id: "orb:xenos:Epic", count: 6 }],
          remaining: [{ id: "orb:xenos:Epic", count: 4 }],
        },
      ],
    } as never)
    plan.addXp(3000, 10_000)
    plan.addXp(undefined, 500)

    expect(plan.needs()).toEqual({
      abilityBadges: {
        Imperial: {
          Rare: { need: 2, short: 0 },
          Epic: { need: 4, short: 3 },
        },
      },
      orbs: { Xenos: { Epic: { need: 6, short: 4 } } },
      forgeBadges: { Epic: { need: 5, short: 3 } },
      components: { Imperial: { need: 6, short: 0 } },
      xp: { need: 10_500, short: 3000 },
    })
  })
})
