import { useCallback, useMemo } from "react"
import type { UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { mapUpgradeStorageToDomain } from "@/features/rank-lookup"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { unitOwnership } from "../unit/unit-ownership"

/** The inventory's Ability upgrade materials, or undefined before the chunk has synced. */
function abilityMaterials(inventory: PlayerDataChunkDto<"inventory"> | null) {
  if (!inventory) return undefined
  const { abilityBadges, forgeBadges, components } = inventory
  return { abilityBadges, forgeBadges, components }
}

/**
 * What the MoW unit page reads besides the MoW itself: the player's MoW and ownership state, shard
 * progress and unlock costs for the header, and the inventory and upgrade catalog for Ability
 * upgrades. Signed out, every player read is `undefined`.
 */
export function useMowPlayerData(unitId: UnitId, isAuthenticated: boolean) {
  const rosterRead = usePlayerChunk("mows")
  const selectMow = useCallback(
    (mows: PlayerDataChunkDto<"mows"> | null) =>
      mows?.find((mow) => mow.unitId === unitId),
    [unitId]
  )
  const playerMowRead = usePlayerChunk("mows", selectMow)
  const selectShard = useCallback(
    (shards: PlayerDataChunkDto<"inventory-shards"> | null) =>
      shards?.find((shard) => shard.unitId === unitId),
    [unitId]
  )
  const shardRead = usePlayerChunk("inventory-shards", selectShard)
  const inventoryRead = usePlayerChunk("inventory", abilityMaterials)
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")
  const unlockCostsRead = useCatalogDataset("unlock-shard-costs", toById)
  const upgradesRead = useCatalogDataset("upgrades")
  const upgrades =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined
  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((u) => [u.id, mapUpgradeStorageToDomain(u)])
      ),
    [upgrades]
  )

  // Signed out, the player reads are ignored (sign-out deletes the player database anyway).
  const playerData = <T>(read: { status: string; data?: T }) =>
    isAuthenticated && read.status === "ready" ? read.data : undefined
  const player = playerData(playerMowRead)
  const loading =
    rosterRead.status === "loading" || playerMowRead.status === "loading"
  return {
    player,
    ownership: unitOwnership(
      playerData(rosterRead) != null,
      player,
      isAuthenticated && loading
    ),
    shardRecord: playerData(shardRead),
    unlockCosts:
      unlockCostsRead.status === "ready" ? unlockCostsRead.data : undefined,
    inventory: playerData(inventoryRead),
    inventoryUpgrades: playerData(inventoryUpgradesRead) ?? undefined,
    upgradesById,
  }
}
