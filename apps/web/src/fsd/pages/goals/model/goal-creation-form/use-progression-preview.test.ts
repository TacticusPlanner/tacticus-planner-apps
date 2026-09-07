import { describe, expect, it } from "vitest"

import {
  farmNodesDailyShards,
  onslaughtRewardKeyForProgression,
  summariseShopCurrencySpend,
} from "./use-progression-preview"

describe("onslaughtRewardKeyForProgression", () => {
  it("uses the current rarity's regular reward below the Mythic tier", () => {
    expect(onslaughtRewardKeyForProgression("Legendary:OneBlueStar")).toBe(
      "Legendary"
    )
    expect(onslaughtRewardKeyForProgression("Rare:TwoStars")).toBe("Rare")
  })

  it("uses the Mythic reward once the current progression is in the Mythic tier", () => {
    expect(onslaughtRewardKeyForProgression("Mythic:OneStar")).toBe("Mythic")
  })

  it("does not consider the goal target — a below-Mythic current tier stays regular (align-acquisition-source-yield-estimates)", () => {
    // Same character, current progression well below Mythic: the key never flips to Mythic
    // regardless of how far the goal's target reaches.
    expect(onslaughtRewardKeyForProgression("Epic:ThreeStars")).toBe("Epic")
  })
})

describe("farmNodesDailyShards", () => {
  it("is energy-bounded for a single uncapped node", () => {
    // 60 energy / 10 per raid = 6 raids * 0.5 drop = 3 shards/day
    expect(
      farmNodesDailyShards(
        [{ energyCost: 10, dropRate: 0.5, dailyAttempts: 0 }],
        60
      )
    ).toBe(3)
  })

  it("is capped by the node's daily attempt limit before energy", () => {
    // energy affords 6 raids but the node caps at 4 -> 4 * 1 = 4 shards/day
    expect(
      farmNodesDailyShards(
        [{ energyCost: 10, dropRate: 1, dailyAttempts: 4 }],
        60
      )
    ).toBe(4)
  })

  it("spends the cheapest node first and stops when the day's energy runs out", () => {
    // 25 energy: 2 raids of the 10-energy node (0.5 each = 1.0), then 5 energy left -> can't
    // afford the 20-energy node at all.
    expect(
      farmNodesDailyShards(
        [
          { energyCost: 20, dropRate: 1, dailyAttempts: 0 },
          { energyCost: 10, dropRate: 0.5, dailyAttempts: 0 },
        ],
        25
      )
    ).toBe(1)
  })
})

describe("summariseShopCurrencySpend", () => {
  const offer = (offerId: string, currency: string) => ({
    offerId,
    rewardQty: 5,
    cost: { currency, amount: 525 },
  })

  it("aggregates two offers sharing a currency into one line", () => {
    const spend = summariseShopCurrencySpend(
      [offer("guild:a", "guildCredits"), offer("guild:b", "guildCredits")],
      new Map([
        ["guild:a", 12], // ceil(12/5) = 3 purchases
        ["guild:b", 8], // ceil(8/5) = 2 purchases
      ])
    )
    expect(spend).toEqual([{ currency: "guildCredits", amount: 5 * 525 }])
  })

  it("keeps distinct currencies on separate lines and drops offers that contributed nothing", () => {
    const spend = summariseShopCurrencySpend(
      [
        offer("guild:a", "guildCredits"),
        offer("rt:b", "rogueTraderCurrency"),
        offer("guild:c", "guildCredits"),
      ],
      new Map([
        ["guild:a", 10], // 2 purchases -> 1050
        ["rt:b", 5], // 1 purchase -> 525
        // guild:c contributed nothing
      ])
    )
    expect(spend).toEqual([
      { currency: "guildCredits", amount: 1050 },
      { currency: "rogueTraderCurrency", amount: 525 },
    ])
  })

  it("returns nothing when no selected offer contributed", () => {
    expect(
      summariseShopCurrencySpend([offer("guild:a", "guildCredits")], new Map())
    ).toEqual([])
  })
})
