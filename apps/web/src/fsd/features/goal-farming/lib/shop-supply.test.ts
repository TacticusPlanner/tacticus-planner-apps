import { describe, expect, it } from "vitest"
import type { ShopShardOffer } from "@workspace/game-catalog"

import {
  mythicShardResourceId,
  shardResourceId,
} from "../model/estimate.domain"
import { projectOnslaughtSupply, projectShopSupply } from "./shop-supply"

// 2026-09-01 is a Tuesday (UTC).
const tuesday = new Date(Date.UTC(2026, 8, 1))

describe("projectShopSupply", () => {
  it("supplies the full guaranteed amount on every day the offer is available", () => {
    const guaranteed: ShopShardOffer = {
      offerId: "guild:shards_hero1",
      shopId: "guild",
      unitId: "hero1",
      rewardType: "shards_hero1",
      isMythic: false,
      rewardQty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      probabilityByDay: {
        MON: 1,
        TUE: 1,
        WED: 1,
        THU: 1,
        FRI: 1,
        SAT: 1,
        SUN: 1,
      },
    }

    const supplier = projectShopSupply(guaranteed, tuesday)

    expect(supplier.resourceId).toBe(shardResourceId("hero1"))
    expect(supplier.supplyOnDay(0)).toBe(10) // Tuesday itself: 5 * 2 * 1
  })

  it("credits a rotating slot at its expected value only on the shared days", () => {
    const rotating: ShopShardOffer = {
      offerId: "guild:shards_bloodIntercessor",
      shopId: "guild",
      unitId: "bloodIntercessor",
      rewardType: "shards_bloodIntercessor",
      isMythic: false,
      rewardQty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      days: ["TUE", "FRI"],
      probabilityByDay: { TUE: 0.5, FRI: 0.5 },
    }

    const supplier = projectShopSupply(rotating, tuesday)

    expect(supplier.supplyOnDay(0)).toBe(5) // Tuesday: 5 * 2 * 0.5
    expect(supplier.supplyOnDay(1)).toBe(0) // Wednesday: not in probabilityByDay
    expect(supplier.supplyOnDay(3)).toBe(5) // Friday: 5 * 2 * 0.5
  })

  it("resolves a mythic offer to the mythic shard resource id", () => {
    const mythic: ShopShardOffer = {
      offerId: "rogue-trader:mythicShards_eldarFarseer",
      shopId: "rogue-trader",
      unitId: "eldarFarseer",
      rewardType: "mythicShards_eldarFarseer",
      isMythic: true,
      rewardQty: 3,
      cost: { currency: "shards", amount: 100 },
      maxPerDay: 1,
      days: ["MON"],
      probabilityByDay: { MON: 1 },
    }

    const supplier = projectShopSupply(mythic, tuesday)

    expect(supplier.resourceId).toBe(mythicShardResourceId("eldarFarseer"))
  })
})

describe("projectOnslaughtSupply", () => {
  it("supplies a constant avgShardsPerRun * runsPerDay every day", () => {
    const supplier = projectOnslaughtSupply({
      entityId: "hero1",
      isMythic: false,
      avgShardsPerRun: 4.5,
    })

    expect(supplier.resourceId).toBe(shardResourceId("hero1"))
    expect(supplier.supplyOnDay(0)).toBeCloseTo(6.75) // 4.5 * 1.5
    expect(supplier.supplyOnDay(10)).toBeCloseTo(6.75)
  })

  it("never supplies a negative amount", () => {
    const supplier = projectOnslaughtSupply({
      entityId: "hero1",
      isMythic: false,
      avgShardsPerRun: -5,
    })

    expect(supplier.supplyOnDay(0)).toBe(0)
  })
})
