import { describe, expect, it } from "vitest"
import type { UpgradeId } from "@workspace/game-domain"

import type { EstimateResourceId } from "@/entities/goal-farming"
import type { UpgradeWithFarmLocations } from "@/entities/rank-lookup"

import { computePlanUpgradeMaterials } from "./plan-upgrade-materials"

const upgrade = (
  id: string,
  rarity: string,
  crafted = false
): [UpgradeId, UpgradeWithFarmLocations] => [
  id as UpgradeId,
  {
    id,
    label: id,
    rarity,
    crafted,
    farmLocations: [],
  } as unknown as UpgradeWithFarmLocations,
]
const upgradesById = new Map([
  upgrade("purity", "Common"),
  upgrade("seal", "Common"),
  upgrade("plasma", "Epic"),
  upgrade("crafted", "Rare", true),
])
const need = (id: string, count: number) => ({
  id: id as EstimateResourceId,
  count,
})
const goalNeeds = [
  { goalId: "a", priority: 1, needs: [need("purity", 40), need("plasma", 6)] },
  // Another project's goal: never in scope, but what it needs is never spare.
  { goalId: "b", priority: 2, needs: [need("seal", 30), need("purity", 10)] },
  // Shards and other non-upgrade needs are left out.
  { goalId: "a2", priority: 3, needs: [need("shard:calgar", 50)] },
]

describe("computePlanUpgradeMaterials", () => {
  const result = computePlanUpgradeMaterials({
    goalNeeds,
    inScope: (goalId) => goalId !== "b",
    missingById: new Map([
      [need("purity", 0).id, 12],
      [need("plasma", 0).id, 6],
    ]),
    costsById: new Map([
      [need("purity", 0).id, { energyToClear: 420, days: 3 }],
      [need("plasma", 0).id, { energyToClear: 900, days: 5 }],
    ]),
    upgradesById,
    inventoryUpgrades: [
      { upgradeId: "purity", amount: 45 },
      { upgradeId: "seal", amount: 50 },
      { upgradeId: "crafted", amount: 4 },
    ],
  })

  it("lists the scoped goals' upgrades, highest rarity first, with required, missing and the cost to farm", () => {
    expect(result.upgrades).toEqual([
      {
        id: "plasma",
        label: "plasma",
        rarity: "Epic",
        required: 6,
        missing: 6,
        energyToClear: 900,
        days: 5,
        goalIds: ["a"],
      },
      {
        id: "purity",
        label: "purity",
        rarity: "Common",
        required: 40,
        missing: 12,
        energyToClear: 420,
        days: 3,
        goalIds: ["a"],
      },
    ])
  })

  it("counts as spare only what no active goal needs, whatever the scope, and no crafted upgrade", () => {
    // purity: 45 owned − (40 + 10) required = −5, so none; seal: 50 − 30 = 20.
    expect(result.spareUpgrades).toEqual([
      { id: "seal", label: "seal", rarity: "Common", spare: 20 },
    ])
  })
})
