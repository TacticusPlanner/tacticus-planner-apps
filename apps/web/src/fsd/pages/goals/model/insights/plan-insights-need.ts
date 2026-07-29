import type {
  CharacterStorageModel,
  MowStorageModel,
} from "@workspace/game-catalog"
import { rankAt, rankIndex, type UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  rankUpUpgradeIds,
  type Character,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import type { GoalDetail } from "@/entities/goal"

import type { EstimateResourceId } from "../estimate/estimate.domain"
import type { UpgradeNeed } from "../estimate/estimate.domain"
import {
  mowAbilityTrackLevel,
  uncoveredMowAbilityUpgradeIds,
} from "../estimate/mow-ability-calc"

// Rank/Ability raw material need-derivation for the Insights plan-wide aggregation
// (plan-insights-calc.ts) — split out purely for that file's max-lines budget.

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

/** A farmable resource's display label — an upgrade's catalog label, or a shard resource's owning
 *  character's name (derived from the `shard:${entityId}` id `shardResourceId` produces). */
export function resourceLabel(
  id: EstimateResourceId,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>,
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
  character: Character | undefined
  playerCharacter: PlayerCharacter | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
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
  const requiredIds = rankUpUpgradeIds(
    params.character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive
  )
  if (requiredIds.length === 0) return null
  const required = aggregateBaseUpgrades(requiredIds, params.upgradesById)

  const appliedIds = params.playerCharacter
    ? appliedUpgradeIds(
        params.character,
        params.playerCharacter.rank,
        params.playerCharacter.appliedUpgradeSlots
      )
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

/** A MoW Ability goal's material demand, net of only what's applied toward each track's current
 *  level — `computeMowMissingUpgrades` called with no loose inventory, for the same plan-wide
 *  shared-pool reason as `rankResourceNeed`. */
export function abilityResourceNeed(params: {
  detail: GoalDetail
  mow: MowStorageModel | undefined
  playerMow: PlayerMow | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
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
