import {
  startingProgression,
  type Progression,
  type Rarity,
} from "@workspace/game-domain"
import type { ProgressionRulesStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { mowAbilityTrackLevel } from "@/features/goal-farming"
import type { ReadState } from "@/shared/lib"
import { mowPowerAt, type UnitPowerContext } from "@/shared/unit-power"

import { powerFigure, type PowerFigure } from "../unit/unit-power.model"

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

/** The mythic ability's level at each Mythic progression, by the MoW ascension steps that carry a
 *  mythic ability multiplier, in step order: 1 blue star is 1 … Mythic Wings is 4 today. */
export type MythicLevels = ReadonlyMap<Progression, number>

/** A module-level selector for `useCatalogDataset("progression-rules", …)`. */
export function toMythicLevels(
  records: readonly Pick<ProgressionRulesStorageModel, "mowProgressionSteps">[]
): MythicLevels {
  const mythicSteps = (records[0]?.mowProgressionSteps ?? []).filter(
    (step) => step.mythicAbilityStatMultiplierPct !== null
  )
  return new Map(
    mythicSteps.map((step, index) => [step.progression, index + 1])
  )
}

/** The mythic ability's level at a progression, or `undefined` below Mythic (not unlocked). */
export function mythicLevel(
  progression: Progression,
  levels: MythicLevels
): number | undefined {
  return levels.get(progression)
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

/** The header power at the shown rarity and stars and the Primary and Secondary panel levels;
 *  loading while the player record is still read (`playerLoading`), since the shown values are the
 *  starting ones until it arrives. */
export function mowPowerFigure(
  mowId: string,
  progression: Progression,
  levels: Record<MowAbility, number>,
  context: ReadState<UnitPowerContext | null>,
  playerLoading = false
): PowerFigure {
  if (playerLoading) return { status: "loading" }
  return powerFigure(context, (ready) =>
    mowPowerAt(
      mowId,
      {
        progression,
        primaryAbilityLevel: levels.primary,
        secondaryAbilityLevel: levels.secondary,
      },
      ready
    )
  )
}
