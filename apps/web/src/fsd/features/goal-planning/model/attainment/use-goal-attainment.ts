import { useMemo } from "react"
import type { UnitId } from "@workspace/game-domain"

import { usePlayerChunk } from "@/shared/local-data"

import {
  computeGoalAttainment,
  UNKNOWN,
  type GoalAttainment,
} from "./goal-attainment"
import { useGoalsFor } from "./use-goals-for"
import { useStableIds } from "../shared/use-stable-ids"
import { chunkOrUndefined, readyData } from "../shared/read-data"

export type GoalAttainmentState = {
  byGoalId: ReadonlyMap<string, GoalAttainment>
  /** True while the goals list or a player-data table is still loading, so `byGoalId` may hold
   *  placeholder `unknown` entries that will change once it settles. A failed list read or an
   *  empty/unsynced player-data table is settled, not pending. */
  pending: boolean
}

/**
 * Batch attainment for every goal id in `goalIds` — the data source for the overview's
 * "Unfulfilled" / "Reached" grouping (plan §3). Reads each goal in full from the goals list (attainment
 * needs `config`'s numeric targets; no per-goal read), and re-evaluates
 * whenever the goals list or a player-data chunk changes (a goal update, or a fresh player-data
 * sync, which refreshes the shared read cache). A never-synced chunk is ready with `undefined`.
 */
export function useGoalAttainmentState(
  requestedGoalIds: readonly string[]
): GoalAttainmentState {
  const goalIds = useStableIds(requestedGoalIds)
  const goals = useGoalsFor(goalIds)
  const charactersRead = usePlayerChunk("characters", chunkOrUndefined)
  const mowsRead = usePlayerChunk("mows", chunkOrUndefined)
  const upgradesRead = usePlayerChunk("inventory-upgrades", chunkOrUndefined)
  const itemsRead = usePlayerChunk("inventory-items", chunkOrUndefined)
  const playerCharacters = readyData(charactersRead)
  const playerMows = readyData(mowsRead)
  const inventoryUpgrades = readyData(upgradesRead)
  const inventoryItems = readyData(itemsRead)

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

  const byGoalId = useMemo(() => {
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
    return result
  }, [
    goalIds,
    goals.goalsById,
    playerCharacterById,
    playerMowById,
    inventoryUpgrades,
    inventoryItems,
  ])
  // A failed read stays pending, as it did before reads reported errors.
  const pending =
    goals.loading ||
    [charactersRead, mowsRead, upgradesRead, itemsRead].some(
      (read) => read.status !== "ready"
    )
  return { byGoalId, pending }
}

/** {@link useGoalAttainmentState}'s per-goal map alone, for callers that don't gate on loading. */
export function useGoalAttainment(
  goalIds: readonly string[]
): ReadonlyMap<string, GoalAttainment> {
  return useGoalAttainmentState(goalIds).byGoalId
}
