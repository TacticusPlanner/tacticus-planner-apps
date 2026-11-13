import { useMemo } from "react"
import {
  computeShopLockContext,
  type RosterUnit,
  type ShopLockContext,
} from "@workspace/game-catalog"
import { progressionStarsIndex } from "@workspace/game-domain"

import { usePlayerDataStatus } from "@/shared/player-data-status"
import { combineReadStates } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"

export interface RosterShopContext {
  /** The roster's tier and unit stars as the shop resolves locks; null without synced player data. */
  lockContext: ShopLockContext | null
  powerLevel: number | undefined
  /** ISO time of the last player-data sync; null when the account never synced. */
  lastSyncedAt: string | null
}

const rosterUnit = (unit: {
  unitId: string
  progressionIndex: string
}): RosterUnit => ({
  unitId: unit.unitId,
  stars: progressionStarsIndex(unit.progressionIndex as never),
})

/**
 * The synced roster as the event shop resolves slots (spec event-shop-planner: the Shop tab lists the
 * selected day's slots). Unlike the goal needs, it is ready without inventory, so an unsynced account
 * still sees every slot option. A failed local read counts as unsynced.
 */
export function useRosterShopContext(): RosterShopContext {
  const { lastSyncedAt } = usePlayerDataStatus()
  const playerDetails = usePlayerChunk("player-details")
  const characters = usePlayerChunk("characters")
  const mows = usePlayerChunk("mows")
  const read = useMemo(
    () => combineReadStates(playerDetails, characters, mows),
    [playerDetails, characters, mows]
  )
  const data = read.status === "ready" ? read.data : undefined

  return useMemo(() => {
    const [details, rosterCharacters, rosterMows] = data ?? [null, null, null]
    if (!details)
      return { lockContext: null, powerLevel: undefined, lastSyncedAt }
    const powerLevel = details.powerLevel ?? 0
    return {
      powerLevel,
      lockContext: computeShopLockContext(
        powerLevel,
        (rosterCharacters ?? []).map(rosterUnit),
        (rosterMows ?? []).map(rosterUnit)
      ),
      lastSyncedAt,
    }
  }, [data, lastSyncedAt])
}
