import type { MowStorageModel } from "@workspace/game-catalog"
import { rankAt, rankIndex, type UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import { uncoveredRankSlots, type AbilityCoverage } from "./goal-need"
import { mowAbilityTrackLevel, type MowAbilityTrack } from "./mow-ability-calc"
import { targetUnitsInSlots } from "./slot-components"
import { aggregateBaseUpgrades, rankUpSlotOccurrences } from "./upgrade-recipe"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]

/**
 * An Upgrade goal's flat need: each target's base upgrade × quantity, minus the pieces of its range that a
 * Rank/Ability goal on the same unit already claimed (capped at the quantity), then claiming up to the
 * quantity of the range's remaining pieces so a later goal sees them covered — which keeps the total
 * independent of goal order. A piece is a range slot that holds the target, or one base piece of the
 * target inside a crafted slot's recipe, so a base-material pre-farm links to a Rank goal whose slots
 * are all crafted. A goal (or MoW track) without a range is additive. Loose inventory is netted later
 * by the plan's priority-ordered allocation. `null` when nothing is needed.
 */
export function upgradeResourceNeed(params: {
  detail: GoalDetail
  character: FarmingCharacter | undefined
  mow: MowStorageModel | undefined
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  /** Mutated in place: this goal's claimed Rank slots and base pieces are added. */
  coveredRankSlots?: Set<string>
  /** Mutated in place: this goal's claimed MoW recipe entries and base pieces go into `mowSlots`. */
  coveredAbilityTransitions?: AbilityCoverage
}) {
  const upgrade = params.detail.config.upgrade
  if (!upgrade || upgrade.targets.length === 0) return null

  const coveredRank = params.coveredRankSlots ?? new Set<string>()
  const transitions = params.coveredAbilityTransitions
  const mowClaims = transitions?.mowSlots ?? new Set<string>()
  const groups = [
    {
      slots: characterRangeSlots(params),
      claims: coveredRank,
      wholeCovered: (key: string) => coveredRank.has(key),
    },
    ...(["primary", "secondary"] as const).map((track) => {
      const items = upgradeGoalMowTrackItems(params, track)
      const levelByKey = new Map(items.map((item) => [item.key, item.level]))
      return {
        slots: items,
        claims: mowClaims,
        wholeCovered: (key: string) =>
          mowClaims.has(key) ||
          (transitions?.[track].has(levelByKey.get(key) ?? -1) ?? false),
      }
    }),
  ]

  const ids: UpgradeId[] = []
  for (const target of upgrade.targets) {
    const id = target.upgradeId as UpgradeId
    const quantity = Math.max(0, target.quantity)
    const units = groups.flatMap((group) =>
      targetUnitsInSlots(group.slots, id, params.upgradesById).map((unit) => ({
        key: unit.key,
        claims: group.claims,
        covered: group.wholeCovered(unit.slotKey) || group.claims.has(unit.key),
      }))
    )
    const overlap = units.filter((unit) => unit.covered).length
    const deduction = Math.min(quantity, overlap)
    let toClaim = quantity - deduction
    for (const unit of units) {
      if (toClaim === 0) break
      if (unit.covered) continue
      unit.claims.add(unit.key)
      toClaim--
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
}): GoalSlotItem[] {
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
): (GoalSlotItem & { level: number })[] {
  const recipes =
    track === "primary"
      ? mow.primaryAbility.recipes
      : mow.secondaryAbility.recipes
  const items: (GoalSlotItem & { level: number })[] = []
  for (
    let level = Math.max(start, mowAbilityTrackLevel(playerMow, track));
    level < end;
    level++
  )
    (recipes[level - 1] ?? []).forEach((id, index) => {
      items.push({ key: `${track}:${level}:${index}`, id, level })
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
  ].map(({ key, id }) => ({ key, id }))
}

/** One MoW track range of an Upgrade goal, as items. Empty without that range or catalog data. */
function upgradeGoalMowTrackItems(
  params: {
    detail: GoalDetail
    mow: MowStorageModel | undefined
    playerMow: PlayerMow | undefined
  },
  track: MowAbilityTrack
) {
  const upgrade = params.detail.config.upgrade
  const range =
    track === "primary" ? upgrade?.activeRange : upgrade?.passiveRange
  if (!range || !params.mow) return []
  return mowTrackItems(
    params.mow,
    params.playerMow,
    track,
    range.start,
    range.end
  )
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
  return [
    ...characterRangeSlots(params),
    ...upgradeGoalMowTrackItems(params, "primary"),
    ...upgradeGoalMowTrackItems(params, "secondary"),
  ].map(({ key, id }) => ({ key, id }))
}
