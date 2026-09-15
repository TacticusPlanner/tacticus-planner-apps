import {
  abilityCapForProgression,
  maxRankForProgression,
  progressionAt,
  progressionIndex as progressionOrdinal,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"
import type { GameCatalogRaidBoss } from "@workspace/game-catalog"

export type GuildRaidInvestmentThreshold = {
  progression: Progression
  requiredRank: Rank
  requiredRankIndex: number
  requiredProgressionIndex: number
  requiredAbilityLevel: number
}

/**
 * Derives the boss-wide required investment threshold from the boss's own catalog stat-progression
 * ladder at the guild's live current step — no authored or invented number anywhere in the chain. The
 * same threshold applies to every hero slot in every recommendation for this boss; there is no per-slot
 * or per-role difficulty data to justify anything finer (see design.md).
 *
 * `liveProgressionIndex` is `GuildRaidBossStatus.progressionIndex`, a 1-based index into
 * `boss.statProgression` (mirrors the API's own `StatStepAt`). Clamped into range rather than thrown on
 * a stale or out-of-range value; `null` only when the boss carries no progression steps at all.
 */
export function resolveGuildRaidInvestmentThreshold(
  boss: Pick<GameCatalogRaidBoss, "statProgression">,
  liveProgressionIndex: number
): GuildRaidInvestmentThreshold | null {
  const steps = boss.statProgression
  if (steps.length === 0) return null

  const clampedIndex = Math.min(Math.max(liveProgressionIndex, 1), steps.length)
  const step = steps[clampedIndex - 1]!

  const progression = progressionAt(step.progressionIndex)
  const requiredRank = maxRankForProgression(progression)

  return {
    progression,
    requiredRank,
    requiredRankIndex: rankIndex(requiredRank),
    requiredProgressionIndex: progressionOrdinal(progression),
    requiredAbilityLevel: abilityCapForProgression(progression),
  }
}

/**
 * `null` when there is no live current step to derive a threshold from — the guild has no observed
 * season (`isObservationActive` false, mirroring `GuildRaidObservationState !== "active"`), or the
 * boss's live status itself is absent/stale. A `null` result is the caller's signal to fall back to the
 * prior ownership-only Ready/Partial/Unavailable display for that recommendation instead of inferring a
 * threshold (0%, 100%, or a floor) — see design.md's "Absent live status falls back to ownership-only
 * display" decision. Takes plain values rather than the `guild-raid-status` entity's own types so this
 * entity stays independent of it; a caller composes the two at the feature/page layer.
 */
export function resolveGuildRaidLiveInvestmentThreshold(params: {
  boss: Pick<GameCatalogRaidBoss, "statProgression">
  isObservationActive: boolean
  liveProgressionIndex: number | undefined
}): GuildRaidInvestmentThreshold | null {
  if (
    !params.isObservationActive ||
    params.liveProgressionIndex === undefined
  ) {
    return null
  }

  return resolveGuildRaidInvestmentThreshold(
    params.boss,
    params.liveProgressionIndex
  )
}
