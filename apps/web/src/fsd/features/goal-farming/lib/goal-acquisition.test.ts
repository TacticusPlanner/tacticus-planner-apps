import { describe, expect, it } from "vitest"
import type {
  GameCatalogShop,
  OnslaughtRewardStorageModel,
} from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"
import type { OnslaughtProgress } from "@/entities/player-data-override"

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

// Only the Gold tier-3 row (Gold tier 4 reads it) — the Onslaught scenarios below either include or
// omit it to show the missing-row fallback.
const goldRewards = [
  {
    id: "Gold-3",
    sector: "Gold",
    tier: 3,
    regular: [
      { min: 3, max: 4 },
      { min: 4, max: 5 },
      { min: 6, max: 7 },
      { min: 10, max: 11 },
      { min: 16, max: 18 },
    ],
    mythic: { min: 1, max: 1 },
  },
] as unknown as OnslaughtRewardStorageModel[]

function ascensionWithOnslaught(rewards: OnslaughtRewardStorageModel[]) {
  return computeGoalAcquisition({
    detail: {
      ...goal("Ascension", "Character", [{ kind: "Onslaught", ids: [] }]),
      config: {
        acquisitionSources: [{ kind: "Onslaught", ids: [] }],
        progression: { start: "Legendary:0", target: "Legendary:3" },
      },
    } as unknown as GoalDetail,
    need: { shards: 100, mythicShards: 0 },
    mowsById: new Map(),
    charactersById: new Map(),
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    onslaughtProgress: {
      imperial: { sector: "Gold", tier: 4 },
    } as unknown as OnslaughtProgress,
    onslaughtRewards: rewards,
    referenceDate: monday,
  })
}

describe("computeGoalAcquisition — Onslaught source (harden-app-against-stale-builds)", () => {
  it("supplies the per-run yield when the sector/tier row exists", () => {
    const result = ascensionWithOnslaught(goldRewards)

    // Legendary at Gold 3: avg 17 shards/run → 100 shards is 6 runs.
    expect(result.onslaughtTokensDelta).toBe(6)
    expect(result.flatSuppliers.map((s) => s.key)).toEqual([
      "onslaught:regular",
    ])
  })

  it("supplies nothing, without throwing, when the row for the player's sector and tier is missing", () => {
    const result = ascensionWithOnslaught([])

    expect(result.onslaughtTokensDelta).toBe(0)
    expect(result.flatSuppliers).toEqual([])
    expect(result.campaignShardsEnabled).toBe(false)
  })
})

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
