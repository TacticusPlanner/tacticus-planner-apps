import { describe, expect, it } from "vitest"
import type { ShopRewardOffer, ShopShardOffer } from "@workspace/game-catalog"

import {
  mythicShardResourceId,
  shardResourceId,
} from "../model/estimate.domain"
import {
  projectOnslaughtSupply,
  projectShopSupply,
  shopOfferPerDay,
  shopSpendFromSupply,
} from "./shop-supply"

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

    expect(supplier.key).toBe("guild:shards_hero1")
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

    expect(supplier.key).toBe("rogue-trader:mythicShards_eldarFarseer")
    expect(supplier.resourceId).toBe(mythicShardResourceId("eldarFarseer"))
  })
})

describe("Mythic-material shop offers (add-mythic-material-shop-sources)", () => {
  // Venerable Battle Mark's real offers for a roster owning a blue-star unit.
  const venerable = (
    shopId: string,
    maxPerDay: number,
    probabilityByDay: ShopRewardOffer["probabilityByDay"],
    currency: string,
    amount: number
  ): ShopRewardOffer => ({
    offerId: `${shopId}:upgHpM004`,
    shopId,
    rewardType: "upgHpM004",
    rewardQty: 1,
    cost: { currency, amount },
    maxPerDay,
    days: Object.keys(probabilityByDay) as ShopRewardOffer["days"],
    probabilityByDay,
  })
  const guild = venerable(
    "guild",
    2,
    { TUE: 1, SAT: 0.25, SUN: 0.25 },
    "guildCredits",
    900
  )
  const crusade = venerable(
    "crusade",
    3,
    { TUE: 1, SAT: 0.25, SUN: 0.25 },
    "crusadeCurrency",
    430
  )
  const rogueTrader = venerable(
    "rogue-trader",
    1,
    { SUN: 1 },
    "elderShopCurrency",
    35
  )

  it("feeds the upgrade id itself as the resource", () => {
    expect(projectShopSupply(guild, tuesday).resourceId).toBe("upgHpM004")
  })

  it("projects 3 / 4.5 / 1 Venerable Battle Mark per week", () => {
    const weekly = (offer: ShopRewardOffer) => {
      const supplier = projectShopSupply(offer, tuesday)
      return [0, 1, 2, 3, 4, 5, 6].reduce(
        (total, day) => total + supplier.supplyOnDay(day),
        0
      )
    }

    expect(weekly(guild)).toBeCloseTo(3)
    expect(weekly(crusade)).toBeCloseTo(4.5)
    expect(weekly(rogueTrader)).toBeCloseTo(1)
    expect(shopOfferPerDay(guild)).toBeCloseTo(3 / 7)
  })
})

describe("projectOnslaughtSupply", () => {
  it("supplies a constant avgShardsPerRun * runsPerDay every day", () => {
    const supplier = projectOnslaughtSupply({
      entityId: "hero1",
      isMythic: false,
      avgShardsPerRun: 4.5,
    })

    expect(supplier.key).toBe("onslaught:regular")
    expect(supplier.resourceId).toBe(shardResourceId("hero1"))
    expect(supplier.supplyOnDay(0)).toBeCloseTo(6.75) // 4.5 * 1.5
    expect(supplier.supplyOnDay(10)).toBeCloseTo(6.75)
  })

  it("never supplies a negative amount", () => {
    const supplier = projectOnslaughtSupply({
      entityId: "hero1",
      isMythic: true,
      avgShardsPerRun: -5,
    })

    expect(supplier.key).toBe("onslaught:mythic")
    expect(supplier.supplyOnDay(0)).toBe(0)
  })
})

describe("shopSpendFromSupply", () => {
  const offer = (offerId: string, currency: string): ShopShardOffer => ({
    offerId,
    shopId: "war",
    unitId: "hero1",
    rewardType: "shards_hero1",
    isMythic: false,
    rewardQty: 5,
    cost: { currency, amount: 900 },
    maxPerDay: 2,
    days: ["TUE"],
    probabilityByDay: { TUE: 1 },
  })

  it("prices each shop supplier's supplied shards per currency and ignores Onslaught", () => {
    const suppliers = [
      projectShopSupply(offer("war:a", "guildWarCurrency"), tuesday),
      projectShopSupply(offer("war:b", "guildWarCurrency"), tuesday),
      projectShopSupply(offer("rt:c", "elderShopCurrency"), tuesday),
      projectOnslaughtSupply({
        entityId: "hero1",
        isMythic: false,
        avgShardsPerRun: 4,
      }),
    ]
    const spend = shopSpendFromSupply(
      new Map([
        ["war:a", 10],
        ["war:b", 5],
        ["rt:c", 0],
        ["onslaught:regular", 40],
      ]),
      suppliers
    )

    // (10 + 5) shards / 5 per purchase * 900 coins; zero-supply and Onslaught add nothing.
    expect([...spend]).toEqual([["guildWarCurrency", 2700]])
  })

  it("is empty with no shop supplier", () => {
    expect(shopSpendFromSupply(new Map(), undefined).size).toBe(0)
  })
})
