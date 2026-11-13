import type {
  GameCatalogEventShop,
  GameCatalogShopVariant,
} from "@workspace/game-catalog"

import type { EventShopCartEntry, EventShopPlan } from "@/entities/event-shop"

// Page-test events: a two-week event from Mon 26 Oct 2026 (so "today", Thu 29 Oct, is day 3) with a
// shard slot gated by unit progress, an orb slot gated by tier, a capped badge slot and a draft slot;
// plus an ended and an upcoming event for the picker and the default-event rules.

const CURRENCY = "seasonalEventCurrencyOctober2026"
const ALL: GameCatalogShopVariant["days"] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]

const variant = (
  type: string,
  qty: number,
  cost: number,
  cap: number,
  extra: Partial<GameCatalogShopVariant> = {}
): GameCatalogShopVariant => ({
  reward: { type, qty },
  cost: { currency: CURRENCY, amount: cost },
  maxPurchasesPerDay: cap,
  days: ALL,
  ...extra,
})

const slots = [
  {
    variants: [
      variant("shards_astraYarrick", 25, 45, 5, {
        days: ["MON", "THU", "SUN"],
        lockId: "lock_below_max_legendary_astraYarrick",
        unitId: "astraYarrick",
      }),
      variant("mythicShards_astraYarrick", 5, 90, 5, {
        days: ["MON", "THU", "SUN"],
        lockId: "lock_max_legendary_astraYarrick",
        unitId: "astraYarrick",
      }),
    ],
  },
  {
    variants: [
      variant("heroAscensionOrbEpic_Imperial", 5, 75, 3, {
        lockId: "lock_mythic_shop_tier_low",
      }),
      variant("heroAscensionOrbLegendary_Imperial", 5, 150, 3, {
        lockId: "lock_mythic_shop_tier_medium",
      }),
      variant("heroAscensionOrbMythic_Imperial", 5, 225, 3, {
        lockId: "lock_mythic_shop_tier_high",
      }),
    ],
  },
  { variants: [variant("abilityTokenUncommon_Imperial", 10, 15, 2)] },
  {
    variants: [
      variant("draft_ascensionOrbsEpic", 5, 60, 2, {
        freeOffer: { type: CURRENCY, qty: 5 },
      }),
    ],
  },
  // The daily freebie: gold ×1 for 1, with 5 event currency back.
  {
    variants: [
      variant("gold", 1, 1, 1, { freeOffer: { type: CURRENCY, qty: 5 } }),
    ],
  },
] as GameCatalogEventShop["weeks"][number]["slots"]

const missions = {
  daily: [
    {
      id: "october_2026_daily_01",
      rewards: [{ type: "xp_seasonal", min: 100, max: 100 }],
      tasks: [{ taskId: "TraverseHexes", target: 150 }],
    },
  ],
  free: [
    {
      id: "october_2026_free_1",
      missions: [
        {
          id: "october_2026_free_1_chain_01",
          rewards: [{ type: "gold", min: 600, max: 660 }],
          tasks: [{ taskId: "DealAbilityDamage", target: 7500 }],
        },
      ],
    },
  ],
  premium: [],
}

export const runningEvent: GameCatalogEventShop = {
  id: "october-2026",
  eventKey: "October2026",
  definitionId: "armageddon-shop",
  currency: CURRENCY,
  startUtc: "2026-10-26T00:00:00Z",
  dayCount: 14,
  milestones: Array.from({ length: 7 }, (_, index) => ({
    requiredProgress: (index + 1) * 30,
    rewards: [{ type: "gold", min: 600, max: 660 }],
  })),
  weeks: [
    {
      week: 1,
      estimatedWeeklyIncome: { free: 750, bonusShipment: 1000 },
      slots,
      progressChests: [
        {
          requiredProgress: 100,
          rewards: [{ type: CURRENCY, min: 15, max: 15 }],
        },
      ],
      missions,
    },
    {
      week: 2,
      slots,
      progressChests: [],
      missions: { daily: [], free: [], premium: [] },
    },
  ],
}

export const endedEvent: GameCatalogEventShop = {
  ...runningEvent,
  id: "june-2026",
  eventKey: "June2026",
  startUtc: "2026-06-22T00:00:00Z",
  dayCount: 7,
  weeks: [runningEvent.weeks[0]!],
}

export const upcomingEvent: GameCatalogEventShop = {
  ...runningEvent,
  id: "december-2026",
  eventKey: "December2026",
  startUtc: "2026-12-07T00:00:00Z",
  dayCount: 7,
  weeks: [runningEvent.weeks[0]!],
}

export const NOW = Date.parse("2026-10-29T12:00:00Z")

export const cartEntry = (
  day: EventShopCartEntry["day"],
  slotIndex: number,
  rewardType: string,
  quantity: number,
  purchasedQuantity = 0,
  week = 1
): EventShopCartEntry => ({
  week,
  day,
  slotIndex,
  rewardType,
  quantity,
  purchasedQuantity,
  draftAlliance: null,
})

export const plan = (
  entries: EventShopCartEntry[],
  revision = 1
): EventShopPlan => ({
  eventId: runningEvent.id,
  revision,
  catalogVersion: "1",
  entries,
})
