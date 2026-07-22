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

export function onslaughtReward(
  rewards: readonly OnslaughtRewardStorageModel[],
  sector: OnslaughtSector,
  tier: number,
  key: OnslaughtRewardKey
): OnslaughtRewardRange {
  const rewardTier = tier === 4 ? 3 : tier
  const row = rewards.find(
    (reward) => reward.sector === sector && reward.tier === rewardTier
  )
  if (!row) throw new Error(`Missing Onslaught rewards for ${sector} ${tier}.`)

  const mythic = key === "LegendaryBlue" || key === "Mythic"
  const range = mythic ? row.mythic : row.regular[rewardKeys.indexOf(key)]
  return { ...range, mythic }
}
