import type { MowStorageModel } from "@workspace/game-catalog"
import { rankAt, rankIndex, type UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import { uncoveredRankSlots } from "./goal-need"
import { mowAbilityTrackLevel, type MowAbilityTrack } from "./mow-ability-calc"
import { aggregateBaseUpgrades, rankUpSlotOccurrences } from "./upgrade-recipe"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

/** A slot of the Upgrade goal's range: the upgrade it holds and the key it claims in the unit's
 *  coverage (a Rank slot key, or a MoW transition's source level). */
type RangeSlot<Key> = { id: UpgradeId; key: Key }

/**
 * An Upgrade goal's flat need: each target's base upgrade × quantity, minus the slots of its range that a
 * Rank/Ability goal on the same unit already claimed (capped at the quantity), then claiming up to the
 * quantity of the range's remaining slots so a later goal sees them covered — which keeps the total
 * independent of goal order. A goal (or MoW track) without a range is additive. Loose inventory is netted
 * later by the plan's priority-ordered allocation. `null` when nothing is needed.
 */
export function upgradeResourceNeed(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  /** Mutated in place: this goal's claimed Rank slots are added. */
  coveredRankSlots?: Set<string>
  /** Mutated in place: this goal's claimed MoW transitions are added. */
  coveredAbilityTransitions?: { primary: Set<number>; secondary: Set<number> }
}) {
  const upgrade = params.detail.config.upgrade
  if (!upgrade || upgrade.targets.length === 0) return null

  const rankSlots = characterRangeSlots(params)
  const trackSlots = (track: MowAbilityTrack) => mowRangeSlots(params, track)
  const primary = trackSlots("primary")
  const secondary = trackSlots("secondary")
  const coveredRank = params.coveredRankSlots ?? new Set<string>()
  const coveredTransitions = params.coveredAbilityTransitions ?? {
    primary: new Set<number>(),
    secondary: new Set<number>(),
  }

  const ids: UpgradeId[] = []
  for (const target of upgrade.targets) {
    const id = target.upgradeId as UpgradeId
    const quantity = Math.max(0, target.quantity)
    const groups = [
      { slots: rankSlots, covered: coveredRank },
      { slots: primary, covered: coveredTransitions.primary },
      { slots: secondary, covered: coveredTransitions.secondary },
    ]
    const inRange = groups.map((group) => ({
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- widens the per-group Set types so the mixed groups share one element type
      covered: group.covered as Set<string | number>,
      slots: group.slots.filter((slot) => slot.id === id),
    }))
    const overlap = inRange.reduce(
      (sum, group) =>
        sum + group.slots.filter((slot) => group.covered.has(slot.key)).length,
      0
    )
    const deduction = Math.min(quantity, overlap)
    let toClaim = quantity - deduction
    for (const group of inRange)
      for (const slot of group.slots) {
        if (toClaim === 0) break
        if (group.covered.has(slot.key)) continue
        group.covered.add(slot.key)
        // A MoW transition's key covers every slot of that id in its row.
        toClaim = Math.max(
          0,
          toClaim - group.slots.filter((other) => other.key === slot.key).length
        )
      }
    for (let index = 0; index < quantity - deduction; index++) ids.push(id)
  }
  return ids.length === 0
    ? null
    : aggregateBaseUpgrades(ids, params.upgradesById)
}

/** The Character rank range's unapplied slots, from the current rank on. */
function characterRangeSlots(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  playerCharacter: PlayerCharacter | undefined
}): RangeSlot<string>[] {
  const range = params.detail.config.upgrade?.rankRange
  if (!range || !params.character) return []
  const start = Math.max(
    range.start,
    params.playerCharacter
      ? rankIndex(params.playerCharacter.rank)
      : range.start
  )
  const occurrences = rankUpSlotOccurrences(
    params.character,
    rankAt(start),
    rankAt(range.end),
    false
  )
  return uncoveredRankSlots({
    occurrences,
    effectiveStart: start,
    playerCharacter: params.playerCharacter,
    coveredRankSlots: undefined,
  })
}

/** One MoW track's range transitions from the current level on; the level `n` → `n+1` transition
 *  uses recipe row `n − 1`, keyed by its source level `n` like `uncoveredMowAbilityUpgradeIds`. */
function mowRangeSlots(
  params: {
    detail: GoalDetail
    mow: MowStorageModel | undefined
    playerMow: PlayerMow | undefined
  },
  track: MowAbilityTrack
): RangeSlot<number>[] {
  const upgrade = params.detail.config.upgrade
  const range =
    track === "primary" ? upgrade?.activeRange : upgrade?.passiveRange
  if (!range || !params.mow) return []
  const recipes =
    track === "primary"
      ? params.mow.primaryAbility.recipes
      : params.mow.secondaryAbility.recipes
  const slots: RangeSlot<number>[] = []
  for (
    let level = Math.max(
      range.start,
      mowAbilityTrackLevel(params.playerMow, track)
    );
    level < range.end;
    level++
  )
    for (const id of recipes[level - 1] ?? []) slots.push({ id, key: level })
  return slots
}

/** A slot item a goal would fill: a Character rank slot (`${rank}:${slot}`) or one recipe entry of a
 *  MoW ability transition (`${track}:${level}:${index}`), with the upgrade it takes. */
export type GoalSlotItem = { key: string; id: UpgradeId }

/** One MoW track's transitions from `max(start, current)` to `end`, one item per recipe entry. */
function mowTrackItems(
  mow: MowStorageModel,
  playerMow: PlayerMow | undefined,
  track: MowAbilityTrack,
  start: number,
  end: number
): GoalSlotItem[] {
  const recipes =
    track === "primary"
      ? mow.primaryAbility.recipes
      : mow.secondaryAbility.recipes
  const items: GoalSlotItem[] = []
  for (
    let level = Math.max(start, mowAbilityTrackLevel(playerMow, track));
    level < end;
    level++
  )
    (recipes[level - 1] ?? []).forEach((id, index) => {
      items.push({ key: `${track}:${level}:${index}`, id })
    })
  return items
}

/** A MoW Ability goal's still-unapplied transition items, ignoring other goals. Empty for a Character
 *  Ability goal (its materials are badges, not upgrades) or without catalog data. */
export function mowAbilityGoalSlotItems(params: {
  detail: GoalDetail
  mow: MowStorageModel | undefined
  playerMow: PlayerMow | undefined
}): GoalSlotItem[] {
  const target = params.detail.config.ability
  if (params.detail.entityType !== "Mow" || !target || !params.mow) return []
  return [
    ...mowTrackItems(
      params.mow,
      params.playerMow,
      "primary",
      target.activeStart,
      target.activeEnd
    ),
    ...mowTrackItems(
      params.mow,
      params.playerMow,
      "secondary",
      target.passiveStart,
      target.passiveEnd
    ),
  ]
}

/** The unapplied slot items of an Upgrade goal's ranges (its Character rank range and MoW track
 *  ranges), keyed like {@link mowAbilityGoalSlotItems} and the Rank goal's slots, so a Rank or Ability
 *  goal on the same unit can be matched slot for slot. Empty for a goal without a range. */
export function upgradeGoalRangeSlotItems(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
}): GoalSlotItem[] {
  const upgrade = params.detail.config.upgrade
  if (!upgrade) return []
  const items: GoalSlotItem[] = [...characterRangeSlots(params)]
  if (params.mow) {
    if (upgrade.activeRange)
      items.push(
        ...mowTrackItems(
          params.mow,
          params.playerMow,
          "primary",
          upgrade.activeRange.start,
          upgrade.activeRange.end
        )
      )
    if (upgrade.passiveRange)
      items.push(
        ...mowTrackItems(
          params.mow,
          params.playerMow,
          "secondary",
          upgrade.passiveRange.start,
          upgrade.passiveRange.end
        )
      )
  }
  return items
}
