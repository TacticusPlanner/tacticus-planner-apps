import { describe, expect, it } from "vitest"
import type { GameCatalogShop } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"

import { computeGoalAcquisition } from "./goal-acquisition"

// Venerable Battle Mark as the real Guild shop serves it: guaranteed on TUE, 1 of 4 on SAT/SUN.
const guild = {
  id: "guild",
  displayLocation: "guildMerchant",
  refreshWithAdWatch: true,
  allowedRefreshesPerDay: 1,
  slots: [
    {
      variants: (
        [
          ["upgHpM001", "WED"],
          ["upgHpM002", "THU"],
          ["upgHpM003", "FRI"],
          ["upgHpM004", "TUE"],
        ] as const
      ).map(([id, day]) => ({
        reward: { type: id, qty: 1 },
        days: [day, "SAT", "SUN"],
        cost: { currency: "guildCredits", amount: 900 },
        maxPurchasesPerDay: 2,
        weight: 1,
      })),
    },
  ],
} as unknown as GameCatalogShop

// 2026-10-05 is a Monday (UTC).
const monday = new Date(Date.UTC(2026, 9, 5))

function goal(
  goalType: string,
  entityType: string,
  acquisitionSources: GoalDetail["config"]["acquisitionSources"]
): GoalDetail {
  return {
    goalId: "goal-1",
    goalType,
    entityType,
    entityId: "spaceRagnar",
    config: { acquisitionSources, farmingLocationIds: ["node-1"] },
  } as unknown as GoalDetail
}

function acquisition(detail: GoalDetail, upgradeNeedIds = ["upgHpM004"]) {
  return computeGoalAcquisition({
    detail,
    need: {
      shards: 0,
      mythicShards: 0,
      upgrades: upgradeNeedIds.map((id) => ({ id })),
    },
    mowsById: new Map(),
    charactersById: new Map(),
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    shops: [guild],
    referenceDate: monday,
  })
}

describe("computeGoalAcquisition — Mythic materials (add-mythic-material-shop-sources)", () => {
  it("uses every available offer when the goal has no saved selection", () => {
    const result = acquisition(goal("Rank", "Character", null))

    expect(result.shopOffers.map((offer) => offer.offerId)).toEqual([
      "guild:upgHpM004",
    ])
    const [supplier] = result.flatSuppliers
    expect(supplier!.resourceId).toBe("upgHpM004")
    expect(supplier!.supplyOnDay(1)).toBe(2) // Tuesday: 2 × 1 × 1
    // Rank's campaign override stays on farmingLocationIds.
    expect(result.acquisitionSources).toBeNull()
  })

  it("uses only the offers an explicit selection names", () => {
    const result = acquisition(
      goal("Upgrade", "Character", [
        { kind: "Shop", ids: ["crusade:upgHpM004"] },
      ])
    )

    expect(result.flatSuppliers).toEqual([])
  })

  it("supplies nothing for an explicit empty selection", () => {
    const result = acquisition(
      goal("Ability", "Mow", [{ kind: "Shop", ids: [] }])
    )

    expect(result.flatSuppliers).toEqual([])
  })

  it("serves a Machine-of-War ability goal but not a Character ability goal", () => {
    expect(
      acquisition(goal("Ability", "Mow", null)).flatSuppliers
    ).toHaveLength(1)
    expect(
      acquisition(goal("Ability", "Character", null)).flatSuppliers
    ).toEqual([])
  })

  it("ignores needs that are not Mythic materials", () => {
    expect(
      acquisition(goal("Rank", "Character", null), ["upgDmgL202"]).flatSuppliers
    ).toEqual([])
  })
})
