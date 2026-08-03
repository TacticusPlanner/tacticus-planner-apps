import type {
  CharacterStorageModel,
  MowStorageModel,
} from "@workspace/game-catalog"
import { rankAt, rankIndex, type UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

import type {
  EstimateResourceId,
  FarmingCharacter,
  FarmingUpgrade,
  UpgradeNeed,
} from "../model/estimate.domain"
import {
  additionalTargetFromWire,
  additionalTargetSelection,
} from ".//rank-additional-target"
import {
  mowAbilityTrackLevel,
  uncoveredMowAbilityUpgradeIds,
} from ".//mow-ability-calc"
import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  rankUpUpgradeIds,
} from ".//upgrade-recipe"

// Rank/Ability raw material need-derivation for the Insights plan-wide aggregation
// (plan-insights-calc.ts) — split out purely for that file's max-lines budget.

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

/** A farmable resource's display label — an upgrade's catalog label, or a shard resource's owning
 *  character's name (derived from the `shard:${entityId}` id `shardResourceId` produces). */
export function resourceLabel(
  id: EstimateResourceId,
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>,
  charactersById: ReadonlyMap<string, CharacterStorageModel>
): string {
  if (id.startsWith("shard:")) {
    const entityId = id.slice("shard:".length)
    return charactersById.get(entityId)?.name ?? id
  }
  return upgradesById.get(id as UpgradeId)?.label ?? id
}

/**
 * A Rank goal's raw material demand net of only what's permanently applied — a direct copy of
 * `usePlanEstimate`'s `toGoalNeed` netting logic (loose inventory stays un-netted here; it's a pool
 * shared across every goal in the plan, so only `estimatePlan`'s own priority-ordered allocation may
 * net it, fed the real inventory separately, or a higher-priority goal's claim would be
 * double-counted). `null` when the goal can't be computed (no rank target, no catalog entry, or an
 * empty range).
 */
export function rankResourceNeed(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
}): UpgradeNeed[] | null {
  const rankTarget = params.detail.config.rank
  if (!rankTarget || !params.character) return null

  const effectiveStart = Math.max(
    rankTarget.start,
    params.playerCharacter
      ? rankIndex(params.playerCharacter.rank)
      : rankTarget.start
  )
  const rankStart = rankAt(effectiveStart)
  const rankEnd = rankAt(rankTarget.end)
  const additionalTarget = additionalTargetSelection(
    additionalTargetFromWire(rankEnd, rankTarget)
  )
  const requiredIds = rankUpUpgradeIds(
    params.character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive,
    additionalTarget.appliedUpgrades,
    additionalTarget.topRowCount
  )
  if (requiredIds.length === 0) return null
  const required = aggregateBaseUpgrades(requiredIds, params.upgradesById)

  // `requiredIds` starts at the character's current rank (or a future configured start), so only
  // slots applied at that exact starting rank can reduce it. Including completed earlier ranks here
  // lets their materials incorrectly cancel a current/future need whenever recipes reuse the same
  // base upgrades.
  const appliedIds =
    params.playerCharacter &&
    effectiveStart === rankIndex(params.playerCharacter.rank)
      ? (params.character.rankUpUpgrades
          .find((entry) => entry.rank === params.playerCharacter!.rank)
          ?.upgradeIds.filter((_, index) =>
            params.playerCharacter!.appliedUpgradeSlots.includes(index)
          ) ?? [])
      : []
  const appliedById = new Map(
    aggregateOwnedBaseUpgrades(appliedIds, [], params.upgradesById).map(
      (entry) => [entry.id, entry.count]
    )
  )

  return required
    .map((need) => ({
      id: need.id,
      count: Math.max(0, need.count - (appliedById.get(need.id) ?? 0)),
    }))
    .filter((need) => need.count > 0)
}

/**
 * A Rank goal's unfilled upgrade *slots* still ahead — 6 per full rank crossed, plus a partial
 * top-row/point-five target at the end rank, minus whatever's already applied at the character's
 * current rank (a full rank below the current one is never partially filled — reaching it required
 * applying all 6 of its slots — so only the current rank's own partial progress ever nets against
 * this). `null` when there's no rank target, no catalog entry for `character`, or an empty range —
 * mirrors `rankResourceNeed`'s guards so the two stay in sync about *when* a Rank goal has a need.
 */
export function rankSlotsRemaining(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
}): number | null {
  const rankTarget = params.detail.config.rank
  if (!rankTarget || !params.character) return null

  const currentRankIndex = params.playerCharacter
    ? rankIndex(params.playerCharacter.rank)
    : rankTarget.start
  const effectiveStart = Math.max(rankTarget.start, currentRankIndex)
  const rankStart = rankAt(effectiveStart)
  const rankEnd = rankAt(rankTarget.end)
  const additionalTarget = additionalTargetSelection(
    additionalTargetFromWire(rankEnd, rankTarget)
  )
  const requiredIds = rankUpUpgradeIds(
    params.character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive,
    additionalTarget.appliedUpgrades,
    additionalTarget.topRowCount
  )
  if (requiredIds.length === 0) return null

  // `requiredIds` unconditionally includes every slot of `rankStart` itself (see `rankUpUpgradeIds`)
  // — only netted here when `rankStart` actually *is* the character's current rank (not a rank ahead
  // of it, which happens when the goal's configured `start` is ahead of where the character actually
  // is; that rank's slots haven't been reached yet, so nothing to net against them).
  const appliedAtCurrentRank =
    effectiveStart === currentRankIndex
      ? new Set(params.playerCharacter?.appliedUpgradeSlots ?? []).size
      : 0

  return Math.max(0, requiredIds.length - appliedAtCurrentRank)
}

/** A MoW Ability goal's material demand, net of only what's applied toward each track's current
 *  level — `computeMowMissingUpgrades` called with no loose inventory, for the same plan-wide
 *  shared-pool reason as `rankResourceNeed`. */
export function abilityResourceNeed(params: {
  detail: GoalDetail
  mow: MowStorageModel | undefined
  playerMow: PlayerMow | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  coveredTransitions?: {
    primary: Set<number>
    secondary: Set<number>
  }
}): UpgradeNeed[] | null {
  const abilityTarget = params.detail.config.ability
  if (!abilityTarget || !params.mow) return null

  const covered = params.coveredTransitions ?? {
    primary: new Set<number>(),
    secondary: new Set<number>(),
  }
  const requiredIds: UpgradeId[] = []
  const appendUncovered = (
    track: "primary" | "secondary",
    recipes: readonly UpgradeId[][],
    start: number,
    end: number
  ) => {
    const current = mowAbilityTrackLevel(params.playerMow, track)
    requiredIds.push(
      ...uncoveredMowAbilityUpgradeIds(
        recipes,
        start,
        end,
        current,
        covered[track]
      )
    )
  }
  appendUncovered(
    "primary",
    params.mow.primaryAbility.recipes,
    abilityTarget.activeStart,
    abilityTarget.activeEnd
  )
  appendUncovered(
    "secondary",
    params.mow.secondaryAbility.recipes,
    abilityTarget.passiveStart,
    abilityTarget.passiveEnd
  )
  if (requiredIds.length === 0) return null
  return aggregateBaseUpgrades(requiredIds, params.upgradesById).map(
    (entry) => ({ id: entry.id, count: entry.count })
  )
}
