import { useLiveQuery } from "dexie-react-hooks"

import type { Progression, UnitId } from "@workspace/game-domain"
import { getInventoryShard } from "@workspace/player-data/queries"

import type { EntityType } from ".//use-create-goal-form"
import { isMythicProgression } from "../estimate/progression-cost-calc"

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
  charactersById: Map<string, { shardLocations?: unknown[] }> | undefined
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

  // A MoW has no `shardLocations` in the catalog at all (unlike a Character, whose farmability can
  // be genuinely absent — an unreleased character has no catalog shard locations yet), so Unlock is
  // simply offered whenever a MoW isn't already owned; its resource cost just isn't estimated yet
  // (see `unlockResourceNeed`'s `isMow` short-circuit).
  const unlockAvailable =
    !!entityId &&
    !isOwned &&
    (entityType === "Mow" ||
      (charactersById?.get(entityId)?.shardLocations?.length ?? 0) > 0)

  return {
    usesMythicShards,
    lockedShards: lockedShard?.amount,
    unlockAvailable,
  }
}
