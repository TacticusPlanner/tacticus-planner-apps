import { useQueries } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getPlayerCharacters,
  getPlayerInventoryItems,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"

import { computeGoalAttainment, type GoalAttainment } from "./goal-attainment"

const UNKNOWN: GoalAttainment = { status: "unknown", reached: false }

/**
 * Batch attainment for every goal id in `goalIds` — the data source for the overview's
 * "Unfulfilled" / "Reached" grouping (plan §3). Fetches each goal's full `GoalDetail` (attainment
 * needs `config`'s numeric targets, which the list endpoint's `GoalSummary` doesn't carry) via
 * `useQueries`, mirroring `goal-detail-sheet.tsx`'s dependency-resolution shape, and re-evaluates
 * automatically whenever the underlying live-queried player-data tables change (a goal update, or a
 * fresh player-data sync) since `useLiveQuery` re-renders this hook's caller on any such change.
 */
export function useGoalAttainment(
  goalIds: readonly string[]
): ReadonlyMap<string, GoalAttainment> {
  const isAuthenticated = useIsAuthenticated()
  const detailQueries = useQueries({
    queries: goalIds.map((goalId) => ({
      ...goalQueries.detail(goalId),
      enabled: isAuthenticated,
    })),
  })
  const playerCharacters = useLiveQuery(() => getPlayerCharacters(), [])
  const playerMows = useLiveQuery(() => getPlayerMows(), [])
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const inventoryItems = useLiveQuery(() => getPlayerInventoryItems(), [])

  const playerCharacterById = new Map(
    (playerCharacters ?? []).map((character) => [character.unitId, character])
  )
  const playerMowById = new Map(
    (playerMows ?? []).map((mow) => [mow.unitId, mow])
  )

  const result = new Map<string, GoalAttainment>()
  detailQueries.forEach((query, index) => {
    const goalId = goalIds[index]
    if (!goalId) return
    const detail = query.data
    if (!detail) {
      result.set(goalId, UNKNOWN)
      return
    }
    const unitId = detail.entityId as UnitId
    result.set(
      goalId,
      computeGoalAttainment({
        detail,
        playerCharacter: playerCharacterById.get(unitId),
        playerMow: playerMowById.get(unitId),
        inventoryUpgrades: inventoryUpgrades ?? [],
        inventoryItems: inventoryItems ?? [],
      })
    )
  })
  return result
}
