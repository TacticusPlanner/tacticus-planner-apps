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
 *  `currentProgression`, from the player's saved Onslaught position. `progressSet` is false when the
 *  player never saved that alliance (0 shards/run, the UI prompts to set it); `available` is false
 *  when there is no position or the saved sector/tier has no reward row for that progression —
 *  shared by the create form's preview and the Edit goal dialog so both show the same yield. */
export function onslaughtShardsPerRun(params: {
  progress: OnslaughtProgress
  rewards: readonly OnslaughtRewardStorageModel[]
  alliance: string
  currentProgression: Progression
}): { shardsPerRun: number; available: boolean; progressSet: boolean } {
  const position = progressForAlliance(params.progress, params.alliance)
  if (!position)
    return { shardsPerRun: 0, available: false, progressSet: false }
  const reward = onslaughtReward(
    params.rewards,
    position.sector,
    position.tier,
    onslaughtRewardKeyForProgression(params.currentProgression)
  )
  return reward
    ? {
        shardsPerRun: (reward.min + reward.max) / 2,
        available: true,
        progressSet: true,
      }
    : { shardsPerRun: 0, available: false, progressSet: true }
}

/** Whether the player saved an Onslaught position for `alliance` — drives the create form's and the
 *  Edit goal dialog's "Set your Onslaught progress" prompt. An alliance the API reports as unset
 *  (its Stone 1 placeholder) counts as not saved. */
export function isOnslaughtProgressSaved(
  progress: OnslaughtProgress | undefined,
  alliance: string | undefined
): boolean {
  return !!progress && !!progressForAlliance(progress, alliance ?? "Imperial")
}

function regularRewardKey(rarity: string) {
  return (
    ["Common", "Uncommon", "Rare", "Epic", "Legendary"].includes(rarity)
      ? rarity
      : "Legendary"
  ) as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
}
