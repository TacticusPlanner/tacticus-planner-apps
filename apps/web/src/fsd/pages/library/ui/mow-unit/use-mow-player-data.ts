import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryAbilityMaterials,
  getInventoryShard,
  getInventoryUpgrades,
  getPlayerMow,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { mapUpgradeStorageToDomain } from "@/features/rank-lookup"

import { unitOwnership } from "../unit/unit-ownership"

// Distinguishes "still reading" from a resolved `undefined` (no record), as Dexie's useLiveQuery
// returns its default until the first resolution.
const LOADING = Symbol("loading")

/**
 * What the MoW unit page reads besides the MoW itself: the player's MoW and ownership state, shard
 * progress and unlock costs for the header, and the inventory and upgrade catalog for Ability
 * upgrades. Signed out, every player read is `undefined`.
 */
export function useMowPlayerData(unitId: UnitId, isAuthenticated: boolean) {
  const roster = useLiveQuery(
    () => (isAuthenticated ? getPlayerMows() : undefined),
    [isAuthenticated],
    LOADING
  )
  const playerMow = useLiveQuery(
    () => (isAuthenticated ? getPlayerMow(unitId) : undefined),
    [isAuthenticated, unitId],
    LOADING
  )
  const shardRecord = useLiveQuery(
    () => (isAuthenticated ? getInventoryShard(unitId) : undefined),
    [isAuthenticated, unitId]
  )
  const inventory = useLiveQuery(
    () => (isAuthenticated ? getInventoryAbilityMaterials() : undefined),
    [isAuthenticated]
  )
  const inventoryUpgrades = useLiveQuery(
    () => (isAuthenticated ? getInventoryUpgrades() : undefined),
    [isAuthenticated]
  )
  const unlockCosts = useLiveQuery(() => getUnlockShardCostsMap(), [])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((u) => [u.id, mapUpgradeStorageToDomain(u)])
      ),
    [upgrades]
  )

  const player = playerMow === LOADING ? undefined : (playerMow ?? undefined)
  return {
    player,
    ownership: unitOwnership(
      roster !== LOADING && roster !== undefined,
      player,
      isAuthenticated && (roster === LOADING || playerMow === LOADING)
    ),
    shardRecord,
    unlockCosts,
    inventory,
    inventoryUpgrades,
    upgradesById,
  }
}
