import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getPlayerCharacters,
  getPlayerInventoryItems,
  getPlayerMows,
} from "@workspace/player-data/queries"

import {
  computeGoalAttainment,
  UNKNOWN,
  type GoalAttainment,
} from "./goal-attainment"
import { useGoalsFor } from "./use-goals-for"

export type GoalAttainmentState = {
  byGoalId: ReadonlyMap<string, GoalAttainment>
  /** True while the goals list or a player-data table is still loading, so `byGoalId` may hold
   *  placeholder `unknown` entries that will change once it settles. A failed list read or an
   *  empty/unsynced player-data table is settled, not pending. */
  pending: boolean
}

/** Wraps a live query's value so "still loading" (`undefined` result) stays distinct from a table
 *  that resolved to `undefined` because it was never synced. */
async function settled<T>(query: () => Promise<T>): Promise<{ value: T }> {
  return { value: await query() }
}

/**
 * Batch attainment for every goal id in `goalIds` — the data source for the overview's
 * "Unfulfilled" / "Reached" grouping (plan §3). Reads each goal in full from the goals list (attainment
 * needs `config`'s numeric targets; no per-goal read), and re-evaluates
 * automatically whenever the underlying live-queried player-data tables change (a goal update, or a
 * fresh player-data sync) since `useLiveQuery` re-renders this hook's caller on any such change.
 */
export function useGoalAttainmentState(
  goalIds: readonly string[]
): GoalAttainmentState {
  const goals = useGoalsFor(goalIds)
  const charactersResult = useLiveQuery(() => settled(getPlayerCharacters), [])
  const mowsResult = useLiveQuery(() => settled(getPlayerMows), [])
  const upgradesResult = useLiveQuery(() => settled(getInventoryUpgrades), [])
  const itemsResult = useLiveQuery(() => settled(getPlayerInventoryItems), [])
  const playerCharacters = charactersResult?.value
  const playerMows = mowsResult?.value
  const inventoryUpgrades = upgradesResult?.value
  const inventoryItems = itemsResult?.value

  const playerCharacterById = useMemo(
    () =>
      new Map(
        (playerCharacters ?? []).map((character) => [
          character.unitId,
          character,
        ])
      ),
    [playerCharacters]
  )
  const playerMowById = useMemo(
    () => new Map((playerMows ?? []).map((mow) => [mow.unitId, mow])),
    [playerMows]
  )

  const result = new Map<string, GoalAttainment>()
  goalIds.forEach((goalId) => {
    const detail = goals.goalsById.get(goalId)
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
        inventoryUpgrades,
        inventoryItems,
      })
    )
  })
  const pending =
    goals.loading ||
    !charactersResult ||
    !mowsResult ||
    !upgradesResult ||
    !itemsResult
  return { byGoalId: result, pending }
}

/** {@link useGoalAttainmentState}'s per-goal map alone, for callers that don't gate on loading. */
export function useGoalAttainment(
  goalIds: readonly string[]
): ReadonlyMap<string, GoalAttainment> {
  return useGoalAttainmentState(goalIds).byGoalId
}
