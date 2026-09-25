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
} from "./rank-additional-target"
import {
  mowAbilityTrackLevel,
  uncoveredMowAbilityUpgradeIds,
} from "./mow-ability-calc"
import {
  aggregateBaseUpgrades,
  aggregateBaseUpgradesWithCraftedInventory,
  rankUpSlotOccurrences,
  type CraftedInventoryPool,
  type RankSlotOccurrence,
} from "./upgrade-recipe"

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
 * The slots of a Rank range this goal still has to charge: not already applied by the player (only slots
 * of the character's current rank can be applied — earlier ranks are complete, later ones not reached, and
 * `effectiveStart` is the rank the range actually starts from), and not already claimed by an earlier goal
 * (`coveredRankSlots`). Pure — the caller decides whether to claim the result.
 */
function uncoveredRankSlots(params: {
  occurrences: readonly RankSlotOccurrence[]
  effectiveStart: number
  playerCharacter: PlayerCharacter | undefined
  coveredRankSlots: ReadonlySet<string> | undefined
}): RankSlotOccurrence[] {
  const { playerCharacter } = params
  const appliedKeys =
    playerCharacter && params.effectiveStart === rankIndex(playerCharacter.rank)
      ? new Set(
          playerCharacter.appliedUpgradeSlots.map(
            (slot) => `${playerCharacter.rank}:${slot}`
          )
        )
      : new Set<string>()
  return params.occurrences.filter(
    (occurrence) =>
      !appliedKeys.has(occurrence.key) &&
      !params.coveredRankSlots?.has(occurrence.key)
  )
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
  /** Mutated in place; share one pool and invoke needs in stage/priority order. */
  craftedInventory?: CraftedInventoryPool
  /**
   * The Rank upgrade slots already claimed for this character by higher-priority goals in the same plan
   * (`rank-milestone-planning`): mutated in place — this goal's newly claimed slots are added — so two
   * Rank targets for one character never charge an overlapping slot twice. Share one set per character
   * across the plan and invoke goals in effective priority order; omit it for a standalone calculation.
   */
  coveredRankSlots?: Set<string>
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
  const occurrences = rankUpSlotOccurrences(
    params.character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive,
    additionalTarget.appliedUpgrades,
    additionalTarget.topRowCount
  )
  if (occurrences.length === 0) return null
  // Each slot is charged once: not if the player already applied it, and not if a higher-priority Rank
  // goal for this character already claimed it. Claim what is charged here so the next goal sees it.
  const uncovered = uncoveredRankSlots({
    occurrences,
    effectiveStart,
    playerCharacter: params.playerCharacter,
    coveredRankSlots: params.coveredRankSlots,
  })
  for (const occurrence of uncovered)
    params.coveredRankSlots?.add(occurrence.key)
  const unappliedIds = uncovered.map((occurrence) => occurrence.id)
  const required = params.craftedInventory
    ? aggregateBaseUpgradesWithCraftedInventory(
        unappliedIds,
        params.upgradesById,
        params.craftedInventory
      )
    : aggregateBaseUpgrades(unappliedIds, params.upgradesById)

  return required.map((need) => ({ id: need.id, count: need.count }))
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
  /** Slots already claimed by higher-priority goals (read-only here — call this *before*
   *  `rankResourceNeed` claims this goal's slots, or they'd all read as covered). */
  coveredRankSlots?: ReadonlySet<string>
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
  const occurrences = rankUpSlotOccurrences(
    params.character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive,
    additionalTarget.appliedUpgrades,
    additionalTarget.topRowCount
  )
  if (occurrences.length === 0) return null

  // Same netting as `rankResourceNeed`: applied slots (only of the character's current rank — see
  // `uncoveredRankSlots`) and slots an earlier goal already claimed don't count.
  return uncoveredRankSlots({
    occurrences,
    effectiveStart,
    playerCharacter: params.playerCharacter,
    coveredRankSlots: params.coveredRankSlots,
  }).length
}

/** A MoW Ability goal's material demand, net of only what's applied toward each track's current
 *  level — `computeMowMissingUpgrades` called with no loose inventory, for the same plan-wide
 *  shared-pool reason as `rankResourceNeed`. */
export function abilityResourceNeed(params: {
  detail: GoalDetail
  mow: MowStorageModel | undefined
  playerMow: PlayerMow | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  /** Mutated in place; share one pool and invoke needs in stage/priority order. */
  craftedInventory?: CraftedInventoryPool
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
  const required = params.craftedInventory
    ? aggregateBaseUpgradesWithCraftedInventory(
        requiredIds,
        params.upgradesById,
        params.craftedInventory
      )
    : aggregateBaseUpgrades(requiredIds, params.upgradesById)
  return required.map((entry) => ({ id: entry.id, count: entry.count }))
}
