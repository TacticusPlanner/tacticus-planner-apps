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
import { mowAbilityTrackLevel } from "./mow-ability-calc"
import { slotsBaseNeed } from "./slot-components"
import {
  rankUpSlotOccurrences,
  type CraftedInventoryPool,
  type RankSlotOccurrence,
} from "./upgrade-recipe"

// Rank/Ability raw material need-derivation for the Insights plan-wide aggregation
// (plan-insights-calc.ts), shared with goal-requirements.ts and upgrade-goal-need.ts.

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

/** What a unit's MoW Ability goals have claimed: transitions by source level per track, plus the
 *  single recipe entries (`${track}:${level}:${index}`) and base pieces inside them that Upgrade goals
 *  claimed (`mowSlots`). Without `mowSlots`, an Upgrade goal's MoW claims stay local to that goal. */
export type AbilityCoverage = {
  primary: Set<number>
  secondary: Set<number>
  mowSlots?: Set<string>
}
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
export function uncoveredRankSlots(params: {
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

/** Every slot of a Rank goal's range from the rank it actually starts at (its start, or the character's
 *  current rank once past it), applied or not. `null` without a rank target or catalog entry, or for an
 *  empty range. */
function rankGoalOccurrences(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
}): { occurrences: RankSlotOccurrence[]; effectiveStart: number } | null {
  const rankTarget = params.detail.config.rank
  if (!rankTarget || !params.character) return null

  const effectiveStart = Math.max(
    rankTarget.start,
    params.playerCharacter
      ? rankIndex(params.playerCharacter.rank)
      : rankTarget.start
  )
  const rankEnd = rankAt(rankTarget.end)
  const additionalTarget = additionalTargetSelection(
    additionalTargetFromWire(rankEnd, rankTarget)
  )
  const occurrences = rankUpSlotOccurrences(
    params.character,
    rankAt(effectiveStart),
    rankEnd,
    rankTarget.endPointFive,
    additionalTarget.appliedUpgrades,
    additionalTarget.topRowCount
  )
  return occurrences.length === 0 ? null : { occurrences, effectiveStart }
}

/** A Rank goal's unapplied slots as `{ key, id }` (key `${rank}:${slot}`), ignoring other goals: what the
 *  goal would draw from loose stock, one piece per slot. Empty when the goal has no range. */
export function rankGoalSlotItems(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
}): RankSlotOccurrence[] {
  const range = rankGoalOccurrences(params)
  if (!range) return []
  return uncoveredRankSlots({
    ...range,
    playerCharacter: params.playerCharacter,
    coveredRankSlots: undefined,
  })
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
  const range = rankGoalOccurrences(params)
  if (!range) return null
  const { occurrences, effectiveStart } = range
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
  // Base pieces an Upgrade goal on this character already claimed inside these slots aren't charged.
  return slotsBaseNeed(
    uncovered,
    params.upgradesById,
    params.coveredRankSlots,
    params.craftedInventory
  )
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
  const range = rankGoalOccurrences(params)
  if (!range) return null
  const { occurrences, effectiveStart } = range

  // Same netting as `rankResourceNeed`: applied slots (only of the character's current rank — see
  // `uncoveredRankSlots`) and slots an earlier goal already claimed don't count.
  return uncoveredRankSlots({
    occurrences,
    effectiveStart,
    playerCharacter: params.playerCharacter,
    coveredRankSlots: params.coveredRankSlots,
  }).length
}

export type RankSlotAllocation = {
  /** Slots this goal adds to the plan: net of applied slots and of slots a higher-priority goal for
   *  the same character already claimed. */
  allocated: number
  /** The goal's own count, ignoring other goals. `allocated` 0 with `standalone` above 0 means an
   *  earlier goal covers it. */
  standalone: number
}

/** A Rank goal's slots as allocated in the plan next to its standalone count. Call it *before*
 *  `rankResourceNeed` claims the goal's slots in `coveredRankSlots`. */
export function rankSlotAllocation(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
  coveredRankSlots: ReadonlySet<string> | undefined
}): RankSlotAllocation {
  return {
    allocated: rankSlotsRemaining(params) ?? 0,
    standalone:
      rankSlotsRemaining({ ...params, coveredRankSlots: undefined }) ?? 0,
  }
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
  /** Mutated in place: this goal's transitions are claimed. Recipe entries and base pieces an Upgrade
   *  goal claimed (`mowSlots`) are skipped. */
  coveredTransitions?: AbilityCoverage
}): UpgradeNeed[] | null {
  const abilityTarget = params.detail.config.ability
  if (!abilityTarget || !params.mow) return null

  const covered = params.coveredTransitions ?? {
    primary: new Set<number>(),
    secondary: new Set<number>(),
  }
  // Each unclaimed transition, minus the recipe entries an Upgrade goal on this MoW claimed whole.
  const items: { key: string; id: UpgradeId }[] = []
  const appendUncovered = (
    track: "primary" | "secondary",
    recipes: readonly UpgradeId[][],
    start: number,
    end: number
  ) => {
    for (
      let level = Math.max(
        start,
        mowAbilityTrackLevel(params.playerMow, track)
      );
      level < end;
      level++
    ) {
      if (covered[track].has(level)) continue
      covered[track].add(level)
      ;(recipes[level - 1] ?? []).forEach((id, index) => {
        const key = `${track}:${level}:${index}`
        if (!covered.mowSlots?.has(key)) items.push({ key, id })
      })
    }
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
  if (items.length === 0) return null
  // Base pieces an Upgrade goal on this MoW already claimed inside these entries aren't charged.
  return slotsBaseNeed(
    items,
    params.upgradesById,
    covered.mowSlots,
    params.craftedInventory
  )
}
