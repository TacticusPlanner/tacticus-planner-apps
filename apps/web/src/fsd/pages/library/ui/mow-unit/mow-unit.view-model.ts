import {
  progressionRarity,
  startingProgression,
  type Progression,
  type Rarity,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { mowAbilityTrackLevel } from "@/features/goal-farming"

import type { MowAbility, MowCostRung } from "./mow-upgrades.model"

export type PlayerMow = PlayerDataChunkDto<"mows">[number]

/**
 * Every MoW starts at Common with no stars: V1's MoW data gives every MoW `initialRarity: Common`, and
 * V2's catalog has no starting rarity for MoWs.
 */
export const MOW_STARTING_RARITY: Rarity = "Common"

export const MOW_STARTING_PROGRESSION: Progression =
  startingProgression(MOW_STARTING_RARITY)

/** The player's primary and secondary ability levels, or level 1 for a MoW they don't own. */
export function mowAbilityLevels(
  player: PlayerMow | undefined
): Record<MowAbility, number> {
  return {
    primary: player ? mowAbilityTrackLevel(player, "primary") : 1,
    secondary: player ? mowAbilityTrackLevel(player, "secondary") : 1,
  }
}

/** Blue stars give the mythic ability its level: 1 blue star is 1 … Mythic Wings is 4. */
const MYTHIC_LEVEL_BY_STARS: Partial<Record<Progression, number>> = {
  "Mythic:OneBlueStar": 1,
  "Mythic:TwoBlueStars": 2,
  "Mythic:ThreeBlueStars": 3,
  "Mythic:MythicWings": 4,
}

export const MYTHIC_MAX_LEVEL = 4

/** The mythic ability's level at a progression, or `undefined` below Mythic (not unlocked). */
export function mythicLevel(progression: Progression): number | undefined {
  if (progressionRarity(progression) !== "Mythic") return undefined
  return MYTHIC_LEVEL_BY_STARS[progression]
}

/** The highest ability level the shared upgrade-cost ladder reaches (60 today). */
export function mowMaxAbilityLevel(costs: readonly MowCostRung[]): number {
  return costs.reduce((max, rung) => Math.max(max, rung.level), 1)
}

/** The ladder by the level each rung reaches. */
export function costsByLevel(
  costs: readonly MowCostRung[]
): Map<number, MowCostRung> {
  return new Map(costs.map((rung) => [rung.level, rung]))
}
