import type { AscensionCostStorageModel } from "@workspace/game-catalog"
import {
  lastProgression,
  levelCapForProgression,
  maxRankForProgression,
  progressionAt,
  progressionIndex,
  progressionOrder,
  progressionRarity,
  rarityRank,
  type Alliance,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { UnitKind } from "@/entities/unit"
import { ascensionResourceNeed } from "@/features/goal-farming"

/** What the progression quick filters read of one owned unit. */
export interface QuickFilterUnit {
  kind: UnitKind
  progression: Progression
  /** Characters only; Machines of War have no rank or XP level. */
  rank?: Rank
  xpLevel?: number
  shards: number
  mythicShards: number
  /** Characters only: active then passive ability level. */
  abilityLevels?: readonly number[]
  /** Characters only: items equipped, and the slots the catalog gives the character. */
  equipped?: number
  equipmentSlots?: number
}

/** The catalog's ascension cost ladder, keyed by the step each entry reaches. */
export type AscensionLadder = ReadonlyMap<string, AscensionCostStorageModel>

/** Ascension orbs the player holds for one alliance, by orb rarity. */
export type HeldOrbs = Partial<Record<Rarity, number>>

type InventoryOrbs = PlayerDataChunkDto<"inventory">["orbs"]

const blueStar: Progression = "Legendary:OneBlueStar"

export function ascensionLadder(
  costs: readonly AscensionCostStorageModel[]
): AscensionLadder {
  return new Map(costs.map((cost) => [cost.progression, cost]))
}

/** The orbs held for `alliance`; an alliance with no orb inventory (Neutral) holds none. */
export function orbsForAlliance(
  orbs: InventoryOrbs | undefined,
  alliance: Alliance
): HeldOrbs {
  const bucket =
    alliance === "Imperial"
      ? orbs?.imperial
      : alliance === "Chaos"
        ? orbs?.chaos
        : alliance === "Xenos"
          ? orbs?.xenos
          : undefined
  const held: HeldOrbs = {}
  for (const entry of bucket ?? []) {
    held[entry.rarity] = (held[entry.rarity] ?? 0) + entry.amount
  }
  return held
}

/** An owned character at its rarity's maximum rank with an ascension step still ahead. */
export function needToAscend(unit: QuickFilterUnit): boolean {
  return (
    unit.kind === "character" &&
    unit.rank !== undefined &&
    unit.progression !== lastProgression &&
    unit.rank === maxRankForProgression(unit.progression)
  )
}

/** An owned character that does not need to ascend and is below its rarity's level cap. */
export function needToLevel(unit: QuickFilterUnit): boolean {
  return (
    unit.kind === "character" &&
    unit.xpLevel !== undefined &&
    !needToAscend(unit) &&
    unit.xpLevel < levelCapForProgression(unit.progression)
  )
}

/** An owned character with an equipment slot left empty. */
export function missingEquipment(unit: QuickFilterUnit): boolean {
  return (
    unit.kind === "character" &&
    unit.equipped !== undefined &&
    unit.equipmentSlots !== undefined &&
    unit.equipped < unit.equipmentSlots
  )
}

/** An owned character with an ability below its XP level, the cap on ability levels. */
export function abilitiesBehindLevel(unit: QuickFilterUnit): boolean {
  const { xpLevel } = unit
  return (
    unit.kind === "character" &&
    xpLevel !== undefined &&
    (unit.abilityLevels ?? []).some((level) => level < xpLevel)
  )
}

/** Can pay for the next rarity's first step (the next step within Mythic) from what it holds. */
export function canAscend(
  unit: QuickFilterUnit,
  ladder: AscensionLadder,
  orbs: HeldOrbs
): boolean {
  const target = ascendTarget(unit.progression)
  return target !== undefined && covers(unit, ladder, orbs, target)
}

/** Below Legendary one blue star and can pay for every step up to it from what it holds. */
export function blueStarReady(
  unit: QuickFilterUnit,
  ladder: AscensionLadder,
  orbs: HeldOrbs
): boolean {
  return (
    progressionIndex(unit.progression) < progressionIndex(blueStar) &&
    covers(unit, ladder, orbs, blueStar)
  )
}

function ascendTarget(current: Progression): Progression | undefined {
  if (current === lastProgression) return undefined
  const rarity = progressionRarity(current)
  if (rarity === "Mythic") return progressionAt(progressionIndex(current) + 1)
  return progressionOrder.find(
    (step) => rarityRank(progressionRarity(step)) > rarityRank(rarity)
  )
}

/** Whether held shards, mythic shards and orbs pay for every step after the unit's current one up
 *  to and including `target`, costed by goal planning's `ascensionResourceNeed`. A step missing
 *  from the ladder cannot be costed, so it never covers. */
function covers(
  unit: QuickFilterUnit,
  ladder: AscensionLadder,
  orbs: HeldOrbs,
  target: Progression
): boolean {
  const from = progressionIndex(unit.progression) + 1
  for (let index = from; index <= progressionIndex(target); index++) {
    if (!ladder.has(progressionAt(index))) return false
  }
  // Net of the held shards; orbs come back gross, so they are compared here.
  const need = ascensionResourceNeed({
    start: unit.progression,
    end: target,
    // Only names the shard to farm, which this check does not read.
    entityId: "",
    isMow: unit.kind === "mow",
    ownedShards: unit.shards,
    ownedMythicShards: unit.mythicShards,
    ascensionCostsById: ladder,
  })
  return (
    need.shards === 0 &&
    need.mythicShards === 0 &&
    Object.entries(need.orbsByType).every(
      ([rarity, amount]) => (orbs[rarity as Rarity] ?? 0) >= amount
    )
  )
}
