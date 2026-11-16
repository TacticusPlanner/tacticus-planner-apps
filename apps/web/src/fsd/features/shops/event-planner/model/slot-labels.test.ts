import { describe, expect, it } from "vitest"
import type {
  GameCatalogShopVariant,
  ResolvedEventSlot,
} from "@workspace/game-catalog"

import { slotLabel } from "./slot-labels"

const variant = (type: string, lockId?: string): GameCatalogShopVariant => ({
  reward: { type, qty: 1 },
  cost: { currency: "seasonalEventCurrencyOctober2026", amount: 45 },
  maxPurchasesPerDay: 5,
  days: ["THU"],
  lockId,
})

const slot = (...variants: GameCatalogShopVariant[]): ResolvedEventSlot => {
  const types = [...new Set(variants.map((v) => v.reward.type))]
  return {
    slotIndex: 1,
    variants,
    offers: types.map((rewardType) => ({
      rewardType,
      rewardQty: 1,
      cost: { currency: "seasonalEventCurrencyOctober2026", amount: 45 },
      maxPerDay: 5,
      isGuaranteed: types.length === 1,
    })),
  }
}

const orbsBySynced = slot(
  variant("heroAscensionOrbMythic_Imperial", "lock_mythic_shop_tier_high")
)
const orbsUnsynced = slot(
  variant("heroAscensionOrbMythic_Imperial", "lock_mythic_shop_tier_high"),
  variant("heroAscensionOrbLegendary_Imperial", "lock_mythic_shop_tier_medium"),
  variant("heroAscensionOrbEpic_Imperial", "lock_mythic_shop_tier_low")
)
const yarrick = slot(
  variant("shards_astraYarrick", "lock_below_max_legendary_astraYarrick"),
  variant("shards_astraYarrick", "lock_not_unlocked_astraYarrick")
)
const yarrickMythic = slot(
  variant("mythicShards_astraYarrick", "lock_max_legendary_astraYarrick")
)

describe("slot labels", () => {
  it("names the tier a synced player's offer comes from", () => {
    expect(slotLabel(orbsBySynced, { tier: "high" })).toEqual({
      kind: "tier",
      tier: "high",
    })
  })

  it("says mythic shards follow a regular shard offer", () => {
    expect(slotLabel(yarrick, { tier: "low", starsByUnitId: {} })).toEqual({
      kind: "thenMythic",
    })
    expect(slotLabel(yarrickMythic, { tier: "high" })).toBeNull()
  })

  it("lists every option without synced data", () => {
    expect(slotLabel(orbsUnsynced, undefined)).toEqual({
      kind: "options",
      reason: "tier",
    })
    expect(
      slotLabel(
        slot(
          variant(
            "shards_astraYarrick",
            "lock_below_max_legendary_astraYarrick"
          ),
          variant(
            "mythicShards_astraYarrick",
            "lock_max_legendary_astraYarrick"
          )
        ),
        undefined
      )
    ).toEqual({ kind: "options", reason: "progress" })
  })

  it("needs no label for a fixed offer", () => {
    expect(slotLabel(slot(variant("gold")), undefined)).toBeNull()
    expect(slotLabel(slot(variant("gold")), { tier: "high" })).toBeNull()
  })
})
