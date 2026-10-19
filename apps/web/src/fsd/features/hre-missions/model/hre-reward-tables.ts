// The HRE reward tables from the wiki's "New Character Events" page (oldid 31077), shipped with the
// app as fixed game rules (design D7). Ranges of "X to X+1" shards use X.

/** Event points threshold → cumulative event currency from milestones. */
export const HRE_MILESTONES: readonly { points: number; cumulative: number }[] =
  [
    [100, 55],
    [250, 115],
    [500, 180],
    [850, 250],
    [1350, 330],
    [2000, 415],
    [3000, 510],
    [4000, 610],
    [5000, 720],
    [6000, 840],
    [7000, 970],
    [8000, 1110],
    [9000, 1260],
    [10_000, 1415],
    [11_000, 1575],
    [12_000, 1740],
    [14_000, 1910],
    [16_000, 2085],
    [18_000, 2265],
    [20_000, 2450],
    [22_000, 2640],
    [24_000, 2835],
    [26_000, 3035],
    [28_000, 3240],
    [30_000, 3450],
    [33_000, 3665],
    [36_000, 3885],
    [40_000, 4110],
    [45_000, 4340],
    [50_000, 4575],
    [60_000, 4815],
    [75_000, 5060],
    [100_000, 5310],
    [250_000, 5565],
    [500_000, 5825],
    [1_000_000, 6090],
  ].map(([points, cumulative]) => ({
    points: points!,
    cumulative: cumulative!,
  }))

/**
 * Leaderboard brackets by their last position ("new position" column), with the daily currency
 * payout and the week 1 and week 2 crates' currency and shards.
 */
export const HRE_BRACKETS: readonly {
  upTo: number
  daily: number
  week1: { currency: number; shards: number }
  week2: { currency: number; shards: number }
}[] = (
  [
    [1, 100, 550, 33, 1100, 66],
    [2, 95, 520, 29, 1040, 58],
    [3, 92, 490, 26, 980, 52],
    [10, 89, 460, 24, 920, 48],
    [25, 86, 430, 23, 860, 46],
    [50, 83, 400, 22, 800, 44],
    [100, 80, 380, 21, 760, 42],
    [150, 77, 360, 20, 720, 40],
    [250, 74, 340, 19, 680, 38],
    [500, 71, 320, 18, 640, 36],
    [1000, 68, 300, 17, 600, 34],
    [1500, 65, 280, 16, 560, 32],
    [2500, 62, 260, 15, 520, 30],
    [5000, 59, 240, 14, 480, 28],
    [10_000, 56, 220, 13, 440, 26],
    [15_000, 53, 200, 12, 400, 24],
    [20_000, 50, 190, 11, 380, 22],
    [25_000, 47, 180, 10, 360, 20],
    [35_000, 44, 170, 9, 340, 18],
    [50_000, 40, 160, 8, 320, 16],
    [75_000, 36, 150, 7, 300, 14],
    [100_000, 32, 140, 6, 280, 12],
    [150_000, 28, 130, 5, 260, 10],
    [200_000, 24, 120, 4, 240, 8],
    [Infinity, 20, 110, 3, 220, 6],
  ] as const
).map(([upTo, daily, w1c, w1s, w2c, w2s]) => ({
  upTo,
  daily,
  week1: { currency: w1c, shards: w1s },
  week2: { currency: w2c, shards: w2s },
}))

/** Chest tiers in order: currency cost and the minimum shards inside. */
export const HRE_CHESTS: readonly { cost: number; shards: number }[] = (
  [
    [100, 10],
    [120, 11],
    [140, 12],
    [160, 13],
    [180, 14],
    [200, 15],
    [220, 16],
    [240, 17],
    [260, 18],
    [280, 19],
    [300, 20],
    [320, 21],
    [340, 22],
    [360, 23],
    [380, 24],
    [400, 26],
    [450, 28],
    [500, 30],
    [550, 32],
    [600, 33],
    [650, 34],
    [700, 35],
    [750, 36],
    [800, 37],
    [850, 38],
    [900, 40],
    [1000, 40],
    [5000, 40],
  ] as const
).map(([cost, shards]) => ({ cost, shards }))

export type HreRarityStepId =
  | "common-0"
  | "common-1"
  | "common-2"
  | "uncommon-2"
  | "uncommon-3"
  | "uncommon-4"
  | "rare-4"
  | "rare-5"
  | "rare-red-1"
  | "epic-red-1"
  | "epic-red-2"
  | "epic-red-3"
  | "legendary-red-3"
  | "legendary-red-4"
  | "legendary-red-5"
  | "legendary-blue-1"

/** Cumulative event shards per rarity step, from a Common unlock up to Legendary blue star. */
export const HRE_RARITY_STEPS: readonly {
  id: HreRarityStepId
  shards: number
  /** The unlock step of a hero of this starting rarity. */
  unlockFor?: "Common" | "Uncommon" | "Rare"
}[] = [
  { id: "common-0", shards: 25, unlockFor: "Common" },
  { id: "common-1", shards: 50 },
  { id: "common-2", shards: 75 },
  { id: "uncommon-2", shards: 100, unlockFor: "Uncommon" },
  { id: "uncommon-3", shards: 150 },
  { id: "uncommon-4", shards: 210 },
  { id: "rare-4", shards: 280, unlockFor: "Rare" },
  { id: "rare-5", shards: 330 },
  { id: "rare-red-1", shards: 390 },
  { id: "epic-red-1", shards: 460 },
  { id: "epic-red-2", shards: 510 },
  { id: "epic-red-3", shards: 570 },
  { id: "legendary-red-3", shards: 670 },
  { id: "legendary-red-4", shards: 770 },
  { id: "legendary-red-5", shards: 970 },
  { id: "legendary-blue-1", shards: 1370 },
]

/** Event missions 1 to 20 each give 100 currency; the Bonus mission gives none. */
export const HRE_MISSION_CURRENCY = 20 * 100
/** Daily payouts arrive on days 2 to 15. */
export const HRE_DAILY_PAYOUTS = 14
/** The "Oh So Close" offer covers a gap of this many shards or fewer. */
export const HRE_OH_SO_CLOSE_SHARDS = 25
