import { describe, expect, it } from "vitest"
import type {
  GameCatalogShop,
  GameCatalogShopVariant,
  ShopDayOfWeek,
} from "@workspace/game-catalog"

import { buildShopRecommendations } from "./shop-recommendations"
import type { ShopNeedAggregate } from "./shop-needs"

function variant(
  input: Partial<GameCatalogShopVariant> &
    Pick<GameCatalogShopVariant, "reward" | "days">
): GameCatalogShopVariant {
  const shardUnitId = /^(?:shards_|mythicShards_)(.+)$/.exec(
    input.reward.type
  )?.[1]
  return {
    cost: { currency: "guildCredits", amount: 500 },
    maxPurchasesPerDay: 2,
    weight: 1,
    ...(shardUnitId ? { unitId: shardUnitId } : {}),
    ...input,
  } as GameCatalogShopVariant
}

function shop(
  id: string,
  ...slots: GameCatalogShopVariant[][]
): GameCatalogShop {
  return {
    id,
    displayLocation: id,
    refreshWithAdWatch: false,
    allowedRefreshesPerDay: 0,
    slots: slots.map((variants) => ({ variants })),
  } as GameCatalogShop
}

const DAY: ShopDayOfWeek = "MON"
const NOW = Date.UTC(2026, 5, 1)
const NO_ROSTER = { powerLevel: 40, lockContext: {}, now: NOW }

function needs(
  entries: Record<
    string,
    { acquired: number; required: number; units?: string[] }
  >
): ShopNeedAggregate {
  return new Map(
    Object.entries(entries).map(([key, value]) => [
      key,
      {
        acquired: value.acquired,
        required: value.required,
        neededBy: (value.units ?? ["hero"]).map((unitId) => ({
          unitId,
          unitName: unitId,
          count: value.required - value.acquired,
        })),
      },
    ])
  )
}

describe("buildShopRecommendations", () => {
  it("recommends a guaranteed offer whose reward is still needed, with cost maths", () => {
    const guild = shop("guild", [
      variant({
        reward: { type: "shards_eldarFarseer", qty: 5 },
        days: ["MON"],
      }),
    ])

    const [section] = buildShopRecommendations({
      shops: [guild],
      needs: needs({ shards_eldarFarseer: { acquired: 30, required: 130 } }),
      day: DAY,
      ...NO_ROSTER,
    })

    expect(section!.guaranteed).toHaveLength(1)
    expect(section!.possible).toHaveLength(0)
    const card = section!.guaranteed[0]!
    expect(card).toMatchObject({
      rewardType: "shards_eldarFarseer",
      unitId: "eldarFarseer",
      acquired: 30,
      required: 130,
      remaining: 100,
      remainingCost: Math.ceil(100 / 5) * 500,
    })
  })

  it("does not recommend an offer for a resource no goal needs", () => {
    const guild = shop("guild", [
      variant({
        reward: { type: "shards_eldarAutarch", qty: 5 },
        days: ["MON"],
      }),
    ])

    const [section] = buildShopRecommendations({
      shops: [guild],
      needs: needs({ shards_eldarFarseer: { acquired: 0, required: 100 } }),
      day: DAY,
      ...NO_ROSTER,
    })

    expect(section!.guaranteed).toHaveLength(0)
    expect(section!.possible).toHaveLength(0)
  })

  it("does not recommend an offer whose need is already satisfied", () => {
    const guild = shop("guild", [
      variant({
        reward: { type: "shards_eldarFarseer", qty: 5 },
        days: ["MON"],
      }),
    ])

    const [section] = buildShopRecommendations({
      shops: [guild],
      needs: needs({ shards_eldarFarseer: { acquired: 130, required: 130 } }),
      day: DAY,
      ...NO_ROSTER,
    })

    expect(section!.guaranteed).toHaveLength(0)
  })

  it("marks a random-slot offer as possible-today", () => {
    const guild = shop("guild", [
      variant({
        reward: { type: "shards_eldarFarseer", qty: 5 },
        days: ["MON"],
      }),
      variant({
        reward: { type: "shards_eldarAutarch", qty: 5 },
        days: ["MON"],
      }),
    ])

    const [section] = buildShopRecommendations({
      shops: [guild],
      needs: needs({ shards_eldarFarseer: { acquired: 0, required: 100 } }),
      day: DAY,
      ...NO_ROSTER,
    })

    expect(section!.guaranteed).toHaveLength(0)
    expect(section!.possible).toHaveLength(1)
    expect(section!.possible[0]!.isGuaranteed).toBe(false)
  })

  it("does not recommend a forge-badge or component offer (out of scope this release)", () => {
    const war = shop("war", [
      variant({
        reward: { type: "itemAscensionResource_Mythic", qty: 1 },
        days: ["MON"],
      }),
      variant({
        reward: { type: "draft_machinesOfWarTokens", qty: 10 },
        days: ["MON"],
      }),
    ])

    const [section] = buildShopRecommendations({
      shops: [war],
      needs: needs({
        itemAscensionResource_Mythic: { acquired: 0, required: 5 },
        draft_machinesOfWarTokens: { acquired: 0, required: 5 },
      }),
      day: DAY,
      ...NO_ROSTER,
    })

    expect(section!.guaranteed).toHaveLength(0)
    expect(section!.possible).toHaveLength(0)
  })

  describe("Rogue Trader penultimate-slot quirk", () => {
    const rogueTrader = shop(
      "rogue-trader",
      [
        variant({
          reward: { type: "mythicShards_eldarLhykhis", qty: 3 },
          days: ["MON"],
        }),
      ],
      [
        variant({
          reward: { type: "upgHpM002", qty: 1 },
          days: ["MON"],
          lockId: "lock_elder_shop_relic_featured_slot_1",
        }),
        variant({ reward: { type: "R_SomeRelic", qty: 1 }, days: ["MON"] }),
      ],
      [
        variant({
          reward: { type: "mythicShards_eldarLhykhis", qty: 3 },
          days: ["MON"],
        }),
      ]
    )

    it("recommends only the penultimate slot's mythic material, condition-stripped", () => {
      const [section] = buildShopRecommendations({
        shops: [rogueTrader],
        needs: needs({
          upgHpM002: { acquired: 1, required: 4 },
          mythicShards_eldarLhykhis: { acquired: 0, required: 9 },
        }),
        day: DAY,
        ...NO_ROSTER,
      })

      expect(section!.guaranteed.map((card) => card.rewardType)).toEqual([
        "upgHpM002",
      ])
      // RT's shard offers in the other slots are never surfaced on the recommendations page.
      expect(
        [...section!.guaranteed, ...section!.possible].some((card) =>
          card.rewardType.startsWith("mythicShards_")
        )
      ).toBe(false)
    })
  })
})
