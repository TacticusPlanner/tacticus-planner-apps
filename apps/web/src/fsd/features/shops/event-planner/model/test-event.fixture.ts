import type {
  GameCatalogEventShop,
  GameCatalogShopVariant,
} from "@workspace/game-catalog"

import type { EventShopCartEntry } from "@/entities/event-shop"

const ALL_DAYS: GameCatalogShopVariant["days"] = [
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
  cost: { currency: "seasonalEventCurrencyOctober2026", amount: cost },
  maxPurchasesPerDay: cap,
  days: ALL_DAYS,
  ...extra,
})

/** A one-week event from Mon 26 Oct 2026 shaped for the spec's worked examples: slot 0 Yarrick shards
 *  (25 for 45, cap 5, Mon/Thu/Sun) and a 30-cost pack, slot 1 a 30-cost pack, slot 2 a 100-cost pack,
 *  slot 3 a 20-cost pack, slot 4 Imperial uncommon badges (10 for 15, cap 5, every day), slot 5 a draft
 *  orb. */
export const testEvent: GameCatalogEventShop = {
  id: "october-2026",
  eventKey: "October2026",
  definitionId: "armageddon-shop",
  currency: "seasonalEventCurrencyOctober2026",
  startUtc: "2026-10-26T00:00:00+00:00",
  dayCount: 7,
  milestones: [],
  weeks: [
    {
      week: 1,
      slots: [
        {
          variants: [
            variant("shards_astraYarrick", 25, 45, 5, {
              unitId: "astraYarrick",
              days: ["MON", "THU", "SUN"],
            }),
            variant("upgDmgL025C", 1, 30, 3, { days: ["TUE", "WED"] }),
          ],
        },
        { variants: [variant("upgArmL021C", 1, 30, 3)] },
        { variants: [variant("mythicDust", 250, 100, 1)] },
        { variants: [variant("specialSummoningToken", 1, 20, 10)] },
        { variants: [variant("abilityTokenUncommon_Imperial", 10, 15, 5)] },
        { variants: [variant("draft_ascensionOrbsEpic", 10, 85, 5)] },
      ],
      progressChests: [],
      missions: { daily: [], free: [], premium: [] },
    },
  ],
}

export const entry = (
  day: EventShopCartEntry["day"],
  slotIndex: number,
  rewardType: string,
  quantity: number,
  purchasedQuantity = 0,
  draftAlliance: EventShopCartEntry["draftAlliance"] = null
): EventShopCartEntry => ({
  week: 1,
  day,
  slotIndex,
  rewardType,
  quantity,
  purchasedQuantity,
  draftAlliance,
})

/** The spec's worked totals cart (today = Thu, day 3): a done, b and c need review, d today, e bought
 *  ahead on Sat. */
export const workedCart: EventShopCartEntry[] = [
  entry("MON", 0, "shards_astraYarrick", 2, 2),
  entry("TUE", 1, "upgArmL021C", 3, 1),
  entry("WED", 2, "mythicDust", 1, 0),
  entry("THU", 0, "shards_astraYarrick", 2, 0),
  entry("SAT", 3, "specialSummoningToken", 1, 1),
]
