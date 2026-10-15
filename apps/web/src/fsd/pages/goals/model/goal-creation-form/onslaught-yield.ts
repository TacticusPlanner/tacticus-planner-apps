import type { OnslaughtRewardStorageModel } from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"

import {
  onslaughtReward,
  progressForAlliance,
  type OnslaughtProgress,
} from "@/entities/player-data-override"

import { isMythicProgression } from "@/features/goal-farming"

/** The Onslaught reward tier that applies to a character at `currentProgression` — Mythic once the
 *  character's *current* progression is in the Mythic tier, otherwise its current rarity's regular
 *  reward. Keyed only on current progression, never the goal target
 *  (align-acquisition-source-yield-estimates). */
export function onslaughtRewardKeyForProgression(currentProgression: string) {
  return isMythicProgression(currentProgression as Progression)
    ? ("Mythic" as const)
    : regularRewardKey(currentProgression.split(":")[0] ?? "")
}

/** The average shards one Onslaught run yields for a character of `alliance` at
 *  `currentProgression`, from the player's saved Onslaught position. `available` is false when the
 *  saved sector/tier has no reward row for that progression (0 shards/run) — shared by the create
 *  form's preview and the Edit goal dialog so both show the same yield. */
export function onslaughtShardsPerRun(params: {
  progress: OnslaughtProgress
  rewards: readonly OnslaughtRewardStorageModel[]
  alliance: string
  currentProgression: Progression
}): { shardsPerRun: number; available: boolean } {
  const position = progressForAlliance(params.progress, params.alliance)
  const reward = onslaughtReward(
    params.rewards,
    position.sector,
    position.tier,
    onslaughtRewardKeyForProgression(params.currentProgression)
  )
  return reward
    ? { shardsPerRun: (reward.min + reward.max) / 2, available: true }
    : { shardsPerRun: 0, available: false }
}

function regularRewardKey(rarity: string) {
  return (
    ["Common", "Uncommon", "Rare", "Epic", "Legendary"].includes(rarity)
      ? rarity
      : "Legendary"
  ) as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
}
