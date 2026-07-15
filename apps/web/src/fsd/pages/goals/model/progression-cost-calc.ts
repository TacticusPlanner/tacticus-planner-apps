import type {
  AscensionCostStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  progressionOrder,
  type Progression,
  type Rarity,
} from "@workspace/game-domain"

import type { MaterialNeed } from "./estimate/estimate.domain"
import {
  shardResourceId,
  type ShardResourceId,
} from "./estimate/estimate.domain"

// Need-derivation for Ascension/Unlock/Shards goals (plan §16 phase 7) — the sibling of
// `goal-spec-builder.ts`'s `computeMissingUpgrades` (Character Rank) and `mow-ability-calc.ts`'s
// `computeMowMissingUpgrades` (MoW Ability). These three goal types are costed in Ascension Orbs and
// shard counts rather than `UpgradeId` materials, via the ascension-costs/unlock-shard-costs catalog
// datasets (plan §16 phase 7 part A/B). Character Ability stays uncosted — no data exists anywhere for
// it (not even in V1) — so it has no sibling here.

/** A goal's derived resource demand: farmable materials/shards (empty `materials` for these goal
 *  types) plus the count-only orb/mythic-shard totals no simulator can farm (Onslaught/events only,
 *  no campaign-node source). `shardId` is set only when there's a net shard need AND the entity is a
 *  Character (a MoW has no `shardLocations` to farm from — plan §16 phase 7 scope notes). */
export type ResourceNeed = {
  materials: MaterialNeed[]
  shardId: ShardResourceId | null
  shards: number
  mythicShards: number
  orbsByType: Partial<Record<Rarity, number>>
}

const EMPTY_NEED: ResourceNeed = {
  materials: [],
  shardId: null,
  shards: 0,
  mythicShards: 0,
  orbsByType: {},
}

/** The shards/mythic shards/orbs to cross every progression step in `(start, end]`, net of what's
 *  already owned (shards/orbs accumulate and carry over between steps, so netting the *total* owned
 *  against the *total* crossed cost is correct regardless of step ordering — the same "total need
 *  minus total owned" shape `computeMissingUpgrades` uses for materials). `[]`/0 for an empty or
 *  invalid range, or when a step is missing from the catalog (defensive — the served dataset always
 *  covers the full ladder). Orbs are reported gross (not netted against owned orb inventory) and are
 *  never farmable — see `ResourceNeed`'s doc comment. */
export function ascensionResourceNeed(params: {
  start: string
  end: string
  entityId: string
  isMow: boolean
  ownedShards: number
  ownedMythicShards: number
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
}): ResourceNeed {
  const {
    start,
    end,
    entityId,
    isMow,
    ownedShards,
    ownedMythicShards,
    ascensionCostsById,
  } = params

  const startIndex = progressionOrder.indexOf(start as Progression)
  const endIndex = progressionOrder.indexOf(end as Progression)
  if (startIndex < 0 || endIndex <= startIndex) return EMPTY_NEED

  let shards = 0
  let mythicShards = 0
  const orbsByType: Partial<Record<Rarity, number>> = {}

  for (let index = startIndex + 1; index <= endIndex; index++) {
    const step = ascensionCostsById.get(progressionOrder[index])
    if (!step) continue

    shards += step.shards
    mythicShards += step.mythicShards
    if (step.orbs > 0 && step.orbRarity) {
      const rarity = step.orbRarity as Rarity
      orbsByType[rarity] = (orbsByType[rarity] ?? 0) + step.orbs
    }
  }

  const netShards = Math.max(0, shards - ownedShards)
  const netMythicShards = Math.max(0, mythicShards - ownedMythicShards)
  if (
    netShards === 0 &&
    netMythicShards === 0 &&
    Object.keys(orbsByType).length === 0
  ) {
    return EMPTY_NEED
  }

  return {
    materials: [],
    shardId: !isMow && netShards > 0 ? shardResourceId(entityId) : null,
    shards: netShards,
    mythicShards: netMythicShards,
    orbsByType,
  }
}

/** The shards to unlock a character of `initialRarity`, net of owned shards. Keyed by the
 *  *character's* starting rarity — the MoW catalog carries no rarity field at all, so a MoW's unlock
 *  economy has no data to key this table by and is left uncosted (`isMow` short-circuits to empty,
 *  same "no data, don't fake it" boundary as Character Ability). */
export function unlockResourceNeed(params: {
  initialRarity: string | undefined
  entityId: string
  isMow: boolean
  ownedShards: number
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
}): ResourceNeed {
  const { initialRarity, entityId, isMow, ownedShards, unlockShardCostsById } =
    params
  if (isMow || !initialRarity) return EMPTY_NEED

  const totalShards = unlockShardCostsById.get(initialRarity)?.shards ?? 0
  const netShards = Math.max(0, totalShards - ownedShards)
  if (netShards === 0) return EMPTY_NEED

  return {
    materials: [],
    shardId: shardResourceId(entityId),
    shards: netShards,
    mythicShards: 0,
    orbsByType: {},
  }
}

/** A Shards goal's own target count is the need directly — it's how a character/MoW *gets* shards
 *  (there's nothing further to look up), mirroring `goal-spec-builder.ts`'s treatment of Shards as
 *  depending on nothing. */
export function shardsResourceNeed(params: {
  count: number
  entityId: string
  isMow: boolean
}): ResourceNeed {
  const { count, entityId, isMow } = params
  if (count <= 0) return EMPTY_NEED

  return {
    materials: [],
    shardId: !isMow ? shardResourceId(entityId) : null,
    shards: count,
    mythicShards: 0,
    orbsByType: {},
  }
}
