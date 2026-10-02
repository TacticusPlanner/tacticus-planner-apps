import type { OnslaughtRewardStorageModel } from "@workspace/game-catalog"

import type { OnslaughtSector } from "@/entities/player-data-override"

export type OnslaughtRewardRange = { min: number; max: number; mythic: boolean }
export type OnslaughtRewardKey =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "LegendaryBlue"
  | "Mythic"

export const rewardKeys: OnslaughtRewardKey[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "LegendaryBlue",
  "Mythic",
]

/**
 * The shard range for a sector/tier/rarity, or `undefined` when the catalog has no row for that
 * sector and tier (a fresh or partial catalog, or a sector the dataset does not cover yet). Callers
 * treat `undefined` as "Onslaught supplies nothing" rather than failing — a missing catalog row
 * must never take down Home or the planner (spec: goal-farming-estimates, Onslaught per-run yield).
 */
export function onslaughtReward(
  rewards: readonly OnslaughtRewardStorageModel[],
  sector: OnslaughtSector,
  tier: number,
  key: OnslaughtRewardKey
): OnslaughtRewardRange | undefined {
  const rewardTier = tier === 4 ? 3 : tier
  const row = rewards.find(
    (reward) => reward.sector === sector && reward.tier === rewardTier
  )
  if (!row) return undefined

  const mythic = key === "LegendaryBlue" || key === "Mythic"
  const range = mythic ? row.mythic : row.regular[rewardKeys.indexOf(key)]
  return { ...range, mythic }
}
