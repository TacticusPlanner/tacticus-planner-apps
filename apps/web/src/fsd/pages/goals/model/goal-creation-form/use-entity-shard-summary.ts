import { useLiveQuery } from "dexie-react-hooks"

import type { Progression, UnitId } from "@workspace/game-domain"
import type { ShopShardOffer } from "@workspace/game-catalog"
import { getInventoryShard } from "@workspace/player-data/queries"

import type { EntityType } from ".//use-create-goal-form"
import { isMythicProgression } from "@/features/goal-farming"

/**
 * Whether the Unlock goal type is offered. A Character needs some way to farm regular shards: a
 * campaign node or a (non-mythic — unlocking never consumes mythic shards) shop offer, so a
 * shop-only unit like Kharn or Ragnar still qualifies. A MoW has no `shardLocations` in the
 * catalog at all, so it is simply offered whenever it isn't already owned (its resource cost just
 * isn't estimated yet — see `unlockResourceNeed`'s `isMow` short-circuit).
 */
export function isUnlockAvailable(params: {
  entityType: EntityType
  isOwned: boolean
  hasEntityId: boolean
  campaignLocationCount: number
  shopOffers: readonly ShopShardOffer[] | undefined
}): boolean {
  if (!params.hasEntityId || params.isOwned) return false
  return (
    params.entityType === "Mow" ||
    params.campaignLocationCount > 0 ||
    (params.shopOffers ?? []).some((offer) => !offer.isMythic)
  )
}

/**
 * Shard-progress data for the selected-entity info card (below the unit picker in
 * `use-create-goal-form.ts`) — split into its own hook purely for that file's own max-lines
 * budget. An owned unit's shard/mythicShard counts live on its own synced record (read by the
 * caller from `playerEntity` directly); a locked one's live in the separate `inventory-shards`
 * chunk keyed by unitId, fetched here.
 */
export function useEntityShardSummary(
  entityType: EntityType,
  entityId: UnitId | undefined,
  isOwned: boolean,
  playerEntity: { progressionIndex: Progression } | undefined,
  charactersById: Map<string, { shardLocations?: unknown[] }> | undefined,
  shopOffers: readonly ShopShardOffer[] | undefined
) {
  const lockedShard = useLiveQuery(
    () => (entityId ? getInventoryShard(entityId) : undefined),
    [entityId]
  )

  // Mythic Shards only become the relevant currency once a unit's current progression has reached
  // that tier (see isMythicProgression) — a locked unit has no current progression yet, and
  // unlocking always costs regular shards regardless of starting rarity, so it's never true there.
  const usesMythicShards =
    !!playerEntity && isMythicProgression(playerEntity.progressionIndex)

  const unlockAvailable = isUnlockAvailable({
    entityType,
    isOwned,
    hasEntityId: !!entityId,
    campaignLocationCount:
      (entityId && charactersById?.get(entityId)?.shardLocations?.length) || 0,
    shopOffers,
  })

  return {
    usesMythicShards,
    lockedShards: lockedShard?.amount,
    unlockAvailable,
  }
}
