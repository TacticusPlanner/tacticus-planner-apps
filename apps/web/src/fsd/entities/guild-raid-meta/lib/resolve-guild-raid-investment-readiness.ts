import {
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"

/** A hero or Machine-of-War slot's synced investment facts — a subset of the roster fields the
 * calculator needs, independent of where the caller sourced them. */
export type GuildRaidInvestmentFacts = {
  rank?: Rank
  progression: Progression
  activeAbilityLevel?: number
  passiveAbilityLevel?: number
}

function cappedRatio(actual: number, required: number): number {
  if (required <= 0) return 1
  return Math.min(1, actual / required)
}

/**
 * A hero slot's readiness percentage (0-100, rounded): `0` when unowned, otherwise the average of
 * three independently-capped ratios (rank, progression, ability), each capped at 100% of the boss-wide
 * threshold. Deliberately not a single combat-power ratio — see design.md's "Score a hero as the
 * average of three independently-capped ratios" decision: this lets rank/progress/abilities each be
 * shown and compared on their own, and it never lets one dimension's overshoot mask another's
 * shortfall.
 */
export function resolveGuildRaidHeroReadiness(params: {
  owned: boolean
  investment: GuildRaidInvestmentFacts | undefined
  threshold: GuildRaidInvestmentThreshold
}): number {
  const { owned, investment, threshold } = params
  if (!owned || !investment) return 0

  const rankRatio = investment.rank
    ? cappedRatio(rankIndex(investment.rank), threshold.requiredRankIndex)
    : 1
  const progressionRatio = cappedRatio(
    progressionIndex(investment.progression),
    threshold.requiredProgressionIndex
  )
  const abilityRatio = cappedRatio(
    ((investment.activeAbilityLevel ?? 0) +
      (investment.passiveAbilityLevel ?? 0)) /
      2,
    threshold.requiredAbilityLevel
  )

  return Math.round(((rankRatio + progressionRatio + abilityRatio) / 3) * 100)
}

/**
 * A Machine of War's readiness percentage (0-100, rounded): `0` when unowned, otherwise the
 * progression ratio alone. Machines of War have no rank field and no ability tracks in the synced
 * roster (`playerMowSchema` is exactly `playerUnitBaseSchema` — no rank, no equipped items), so padding
 * this with a fabricated second or third dimension would not reflect any real investment.
 */
export function resolveGuildRaidMowReadiness(params: {
  owned: boolean
  progression: Progression | undefined
  threshold: GuildRaidInvestmentThreshold
}): number {
  const { owned, progression, threshold } = params
  if (!owned || progression === undefined) return 0

  return Math.round(
    cappedRatio(
      progressionIndex(progression),
      threshold.requiredProgressionIndex
    ) * 100
  )
}
