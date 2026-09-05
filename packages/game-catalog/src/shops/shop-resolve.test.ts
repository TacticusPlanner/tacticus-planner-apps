import { describe, expect, it } from "vitest"

import type { GameCatalogShop, GameCatalogShopVariant } from "../record-types"
import {
  computeShopLockContext,
  resolveEventLockId,
  resolveShopOffersForToday,
  resolveShopSlotsForDay,
  resolveUnitShardShopOffers,
  todayDow,
} from "./shop-resolve"

type VariantInput = Partial<GameCatalogShopVariant> &
  Pick<GameCatalogShopVariant, "reward" | "days">

function variant(input: VariantInput): GameCatalogShopVariant {
  // The served catalog always sets `unitId` on a shard reward variant; mirror that in the fixture.
  const shardUnitId = /^(?:shards_|mythicShards_)(.+)$/.exec(
    input.reward.type
  )?.[1]

  return {
    cost: { currency: "guildCredits", amount: 525 },
    maxPurchasesPerDay: 2,
    weight: 1,
    ...(shardUnitId ? { unitId: shardUnitId } : {}),
    ...input,
  } as GameCatalogShopVariant
}

function shop(...slots: GameCatalogShopVariant[][]): GameCatalogShop {
  return {
    id: "guild",
    displayLocation: "guildMerchant",
    refreshWithAdWatch: true,
    allowedRefreshesPerDay: 1,
    slots: slots.map((variants) => ({ variants })),
  } as GameCatalogShop
}

const noRoster = { lockContext: {}, powerLevel: 30 }

describe("resolveShopOffersForToday (goal-tracking form)", () => {
  it("returns only variants available on the requested day, flattened across slots", () => {
    const data = shop(
      [
        variant({
          reward: { type: "shards_eldarFarseer", qty: 5 },
          days: ["MON", "THU"],
        }),
      ],
      [variant({ reward: { type: "gold", qty: 1000 }, days: ["TUE"] })]
    )

    const monday = resolveShopOffersForToday(data, { ...noRoster, day: "MON" })
    expect(monday.map((offer) => offer.rewardType)).toEqual([
      "shards_eldarFarseer",
    ])
    expect(monday[0]).toMatchObject({
      unitId: "eldarFarseer",
      rewardQty: 5,
      maxPerDay: 2,
      cost: { currency: "guildCredits", amount: 525 },
      isGuaranteed: true,
    })

    expect(
      resolveShopOffersForToday(data, { ...noRoster, day: "WED" })
    ).toEqual([])
  })

  it("filters by power-level bounds", () => {
    const data = shop([
      variant({
        reward: { type: "gold", qty: 1000 },
        days: ["MON"],
        minPowerLevel: 21,
        maxPowerLevel: 30,
      }),
    ])

    expect(
      resolveShopOffersForToday(data, {
        day: "MON",
        lockContext: {},
        powerLevel: 25,
      })
    ).toHaveLength(1)
    expect(
      resolveShopOffersForToday(data, {
        day: "MON",
        lockContext: {},
        powerLevel: 10,
      })
    ).toHaveLength(0)
    expect(
      resolveShopOffersForToday(data, {
        day: "MON",
        lockContext: {},
        powerLevel: 40,
      })
    ).toHaveLength(0)
  })

  it("marks a slot random when its day-matching variants resolve to different reward types", () => {
    const data = shop([
      variant({
        reward: { type: "shards_spaceWulfen", qty: 5 },
        days: ["MON"],
      }),
      variant({ reward: { type: "shards_spaceHound", qty: 5 }, days: ["MON"] }),
    ])

    const offers = resolveShopOffersForToday(data, { ...noRoster, day: "MON" })
    expect(offers).toHaveLength(2)
    expect(offers.every((offer) => offer.isGuaranteed)).toBe(false)
  })

  it("hides variants behind an unrecognized lock (strict resolution) but shows bp-season windows in range", () => {
    const data = shop(
      [
        variant({
          reward: { type: "shards_x", qty: 5 },
          days: ["MON"],
          lockId: "lock_hero_not_maxed_out_astarLysander",
        }),
      ],
      [
        variant({
          reward: { type: "shards_y", qty: 5 },
          days: ["MON"],
          lockId: "lock_valid_until_bp_season_40_start",
        }),
      ]
    )
    const now = Date.UTC(2026, 6, 1) // before bp season 40

    const offers = resolveShopOffersForToday(data, {
      ...noRoster,
      day: "MON",
      now,
    })
    expect(offers.map((offer) => offer.rewardType)).toEqual(["shards_y"])
  })

  it("resolves the crusade owns-blue-star-unit lock from the roster context", () => {
    const data = shop([
      variant({
        reward: { type: "mythicShards_z", qty: 3 },
        days: ["MON"],
        lockId: "lock_crusade_shop_owns_unit_at_mythic",
      }),
    ])

    const withBlueStar = computeShopLockContext(
      30,
      [{ unitId: "someUnit", stars: 12 }],
      []
    )
    const withoutBlueStar = computeShopLockContext(
      30,
      [{ unitId: "someUnit", stars: 5 }],
      []
    )

    expect(
      resolveShopOffersForToday(data, {
        day: "MON",
        powerLevel: 30,
        lockContext: withBlueStar,
      })
    ).toHaveLength(1)
    expect(
      resolveShopOffersForToday(data, {
        day: "MON",
        powerLevel: 30,
        lockContext: withoutBlueStar,
      })
    ).toHaveLength(0)
  })
})

describe("resolveShopSlotsForDay (permissive browsing form)", () => {
  it("keeps a multi-reward slot grouped as one slot with every option", () => {
    const data = shop([
      variant({
        reward: { type: "shards_spaceWulfen", qty: 5 },
        days: ["MON", "THU"],
      }),
      variant({
        reward: { type: "shards_spaceHound", qty: 5 },
        days: ["TUE", "FRI"],
      }),
      variant({
        reward: { type: "shards_spaceRockfist", qty: 5 },
        days: ["WED", "SAT"],
      }),
    ])

    const monday = resolveShopSlotsForDay(data, "MON")
    expect(monday).toHaveLength(1)
    expect(monday[0]!.offers.map((offer) => offer.rewardType)).toEqual([
      "shards_spaceWulfen",
    ])

    // A day where two of the three variants are available → one slot, two options.
    const wednesday = resolveShopSlotsForDay(
      shop([
        variant({ reward: { type: "a", qty: 1 }, days: ["WED"] }),
        variant({ reward: { type: "b", qty: 1 }, days: ["WED"] }),
      ]),
      "WED"
    )
    expect(wednesday).toHaveLength(1)
    expect(wednesday[0]!.offers).toHaveLength(2)
  })

  it("resolves an arbitrary (non-today) day with no roster context", () => {
    const data = shop([
      variant({ reward: { type: "gold", qty: 1000 }, days: ["SUN"] }),
    ])

    expect(resolveShopSlotsForDay(data, "SUN")).toHaveLength(1)
    expect(resolveShopSlotsForDay(data, "MON")).toEqual([])
  })

  it("shows variants behind an unrecognized roster lock (permissive)", () => {
    const data = shop([
      variant({
        reward: { type: "shards_x", qty: 5 },
        days: ["MON"],
        lockId: "lock_hero_not_maxed_out_astarLysander",
      }),
    ])

    expect(resolveShopSlotsForDay(data, "MON")).toHaveLength(1)
  })

  it("ignores power-level bounds when no powerLevel is supplied", () => {
    const data = shop([
      variant({
        reward: { type: "gold", qty: 1000 },
        days: ["MON"],
        minPowerLevel: 41,
      }),
    ])

    expect(resolveShopSlotsForDay(data, "MON")).toHaveLength(1)
    expect(resolveShopSlotsForDay(data, "MON", { powerLevel: 20 })).toEqual([])
  })

  it("returns an empty list for a day with no available slots", () => {
    const data = shop([
      variant({ reward: { type: "gold", qty: 1 }, days: ["MON"] }),
    ])

    expect(resolveShopSlotsForDay(data, "SAT")).toEqual([])
  })
})

describe("ported lock vocabulary parity (V1 shop-resolve.spec.ts)", () => {
  const beforeRotation = Date.UTC(2026, 8, 5)
  const afterRotation = Date.UTC(2026, 8, 6)

  it("serves the elder-shop currently-featured locks before the rotation boundary", () => {
    expect(
      resolveEventLockId(
        "lock_elder_shop_leg_featured_currently",
        {},
        beforeRotation
      )
    ).toBe(true)
    expect(
      resolveEventLockId(
        "lock_elder_shop_leg_featured_next",
        {},
        beforeRotation
      )
    ).toBe(false)
  })

  it("serves the elder-shop next-featured locks on/after the rotation boundary", () => {
    expect(
      resolveEventLockId(
        "lock_elder_shop_leg_featured_currently_mythic",
        {},
        afterRotation
      )
    ).toBe(false)
    expect(
      resolveEventLockId(
        "lock_elder_shop_leg_featured_next_mythic",
        {},
        afterRotation
      )
    ).toBe(true)
  })

  it("defaults an unrecognized lock to visible in the permissive resolver", () => {
    expect(resolveEventLockId("lock_some_future_thing", {})).toBe(true)
  })
})

describe("todayDow", () => {
  it("maps a UTC timestamp to its day token", () => {
    expect(todayDow(Date.UTC(2026, 8, 6))).toBe("SUN") // 2026-09-06 is a Sunday
    expect(todayDow(Date.UTC(2026, 8, 7))).toBe("MON")
  })
})

describe("resolveUnitShardShopOffers (goal-planning form, tacticus-planner-apps#103)", () => {
  it("is guaranteed every day for a single-variant slot", () => {
    const eldarFarseerShop = shop([
      variant({
        reward: { type: "shards_eldarFarseer", qty: 5 },
        maxPurchasesPerDay: 2,
        days: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
      }),
    ])

    const offers = resolveUnitShardShopOffers(
      [eldarFarseerShop],
      "eldarFarseer"
    )

    expect(offers).toHaveLength(1)
    expect(offers[0]).toMatchObject({
      offerId: "guild:shards_eldarFarseer",
      shopId: "guild",
      rewardType: "shards_eldarFarseer",
      isMythic: false,
      rewardQty: 5,
      maxPerDay: 2,
    })
    expect(offers[0]!.days.sort()).toEqual(
      ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].sort()
    )
    for (const day of offers[0]!.days) {
      expect(offers[0]!.probabilityByDay[day]).toBe(1)
    }
  })

  it("credits a rotating slot at its weighted share, and only on the shared days", () => {
    // The real Guild slot: bloodIntercessor vs worldExecutions, both weight 1, TUE/FRI only.
    const guildShop = shop([
      variant({
        reward: { type: "shards_bloodIntercessor", qty: 5 },
        days: ["TUE", "FRI"],
        weight: 1,
      }),
      variant({
        reward: { type: "shards_worldExecutions", qty: 5 },
        days: ["TUE", "FRI"],
        weight: 1,
      }),
    ])

    const offers = resolveUnitShardShopOffers([guildShop], "bloodIntercessor")

    expect(offers).toHaveLength(1)
    expect(offers[0]!.days.sort()).toEqual(["FRI", "TUE"])
    expect(offers[0]!.probabilityByDay.TUE).toBeCloseTo(0.5)
    expect(offers[0]!.probabilityByDay.FRI).toBeCloseTo(0.5)
    expect(offers[0]!.probabilityByDay.MON).toBeUndefined()
  })

  it("raises the survivor's probability when a same-slot variant is excluded by power level", () => {
    const gatedShop = shop([
      variant({
        reward: { type: "shards_worldJakhal", qty: 5 },
        days: ["MON"],
        weight: 1,
      }),
      variant({
        reward: { type: "shards_worldExecutions", qty: 5 },
        days: ["MON"],
        weight: 1,
        minPowerLevel: 999,
      }),
    ])

    const offers = resolveUnitShardShopOffers([gatedShop], "worldJakhal", {
      powerLevel: 30,
    })

    expect(offers).toHaveLength(1)
    expect(offers[0]!.probabilityByDay.MON).toBe(1)
  })

  it("returns nothing for a unit no shop offers", () => {
    const guildShop = shop([
      variant({
        reward: { type: "shards_eldarFarseer", qty: 5 },
        days: ["MON"],
      }),
    ])

    expect(resolveUnitShardShopOffers([guildShop], "nobody")).toEqual([])
  })

  it("distinguishes a unit's regular and mythic shard offers", () => {
    const rogueTraderShop = {
      ...shop(
        [
          variant({
            reward: { type: "shards_eldarFarseer", qty: 5 },
            days: ["MON"],
          }),
        ],
        [
          variant({
            reward: { type: "mythicShards_eldarFarseer", qty: 3 },
            days: ["MON"],
          }),
        ]
      ),
      id: "rogue-trader",
    }

    const offers = resolveUnitShardShopOffers([rogueTraderShop], "eldarFarseer")

    expect(offers).toHaveLength(2)
    const regular = offers.find((offer) => !offer.isMythic)!
    const mythic = offers.find((offer) => offer.isMythic)!
    expect(regular.offerId).toBe("rogue-trader:shards_eldarFarseer")
    expect(mythic.offerId).toBe("rogue-trader:mythicShards_eldarFarseer")
    expect(regular.offerId).not.toBe(mythic.offerId)
  })

  it("merges the same offer across two slots of one shop", () => {
    const shopWithTwoSlots = shop(
      [
        variant({
          reward: { type: "shards_eldarFarseer", qty: 5 },
          days: ["MON"],
        }),
      ],
      [
        variant({
          reward: { type: "shards_eldarFarseer", qty: 5 },
          days: ["THU"],
        }),
      ]
    )

    const offers = resolveUnitShardShopOffers(
      [shopWithTwoSlots],
      "eldarFarseer"
    )

    expect(offers).toHaveLength(1)
    expect(offers[0]!.days.sort()).toEqual(["MON", "THU"])
    expect(offers[0]!.probabilityByDay.MON).toBe(1)
    expect(offers[0]!.probabilityByDay.THU).toBe(1)
  })
})
