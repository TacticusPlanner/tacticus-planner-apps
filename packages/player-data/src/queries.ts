// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// chunk-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import { getChunkData, getChunkRecord } from "./player-data-storage"
import type { PlayerDataChunkDto } from "./player-data.dto"
import type { UnitId } from "@workspace/game-domain"

export function getInventoryUpgrades(): Promise<
  PlayerDataChunkDto<"inventory-upgrades"> | undefined
> {
  return getChunkData("inventory-upgrades")
}

export function getPlayerCharacter(
  unitId: UnitId
): Promise<PlayerDataChunkDto<"characters">[number] | undefined> {
  return getChunkRecord("characters", unitId)
}

export function getPlayerMow(
  unitId: UnitId
): Promise<PlayerDataChunkDto<"mows">[number] | undefined> {
  return getChunkRecord("mows", unitId)
}

// The caller's whole roster, e.g. for building an owned/locked-id lookup across an entire catalog
// (see goals' create-goal-sheet unit picker) — getPlayerCharacter/getPlayerMow above are for the
// single-selected-unit case.
export function getPlayerCharacters(): Promise<
  PlayerDataChunkDto<"characters"> | undefined
> {
  return getChunkData("characters")
}

export function getPlayerMows(): Promise<
  PlayerDataChunkDto<"mows"> | undefined
> {
  return getChunkData("mows")
}

// The caller's un-equipped equipment/relic stock ({itemId, level, amount} — itemId matches the
// game-catalog `equipment` dataset's id), synced from the Tacticus API's own inventory but never
// consumed anywhere in this app until the UpgradeEquipment goal type — see the `Equipment` GoalEntityType.
export function getPlayerInventoryItems(): Promise<
  PlayerDataChunkDto<"inventory-items"> | undefined
> {
  return getChunkData("inventory-items")
}

// Shard progress toward a unit not yet unlocked (absent from `characters`/`mows`, whose own records
// carry an already-unlocked unit's shards/mythicShards instead — see the schema comment).
export function getInventoryShard(
  unitId: UnitId
): Promise<PlayerDataChunkDto<"inventory-shards">[number] | undefined> {
  return getChunkRecord("inventory-shards", unitId)
}

export function getLiveProgress(): Promise<
  PlayerDataChunkDto<"live-progress"> | undefined
> {
  return getChunkData("live-progress")
}

export function getCampaignProgress(): Promise<
  PlayerDataChunkDto<"campaign-progress"> | undefined
> {
  return getChunkData("campaign-progress")
}

export function getCampaignEventProgress(): Promise<
  PlayerDataChunkDto<"campaign-events-progress"> | undefined
> {
  return getChunkData("campaign-events-progress")
}

// The caller's owned XP books ({xpBookId, amount}[]), synced as part of the merged "inventory"
// chunk (see chunk-keys.ts) — pulled out as its own named query since Level goals are the only
// current consumer (see the Level goal's resource-cost preview).
export async function getInventoryXpBooks(): Promise<
  PlayerDataChunkDto<"inventory">["xpBooks"] | undefined
> {
  return (await getChunkData("inventory"))?.xpBooks
}

/** Owned ascension orbs grouped by alliance and rarity. */
export async function getInventoryOrbs(): Promise<
  PlayerDataChunkDto<"inventory">["orbs"] | undefined
> {
  return (await getChunkData("inventory"))?.orbs
}
