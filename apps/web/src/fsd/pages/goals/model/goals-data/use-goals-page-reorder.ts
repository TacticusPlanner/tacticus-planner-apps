import { useEffect, useMemo } from "react"

import { holdsGlobalPosition } from "@/entities/goal"
import {
  useGoalOrderActions,
  useMobileReorderMode,
} from "@/features/goal-order"

import { displacedByDrop } from "../projects/goal-order"
import { orderRowsByGlobalPriority } from "../shared/goal-row-order"
import type { GoalRow } from "../shared/types"

/**
 * Reordering on the Goals page: turns a drop on the visible (filtered and/or grouped) list into the
 * single move the API takes, resolved against the complete in-flight order so hidden goals keep their
 * relative order, plus the mobile reorder mode. `available` is false when the shown status cannot
 * hold in-flight goals (Archived) or there is nothing to reorder.
 */
export function useGoalsPageReorder(
  allRows: readonly GoalRow[],
  available: boolean
) {
  const orderActions = useGoalOrderActions()
  const {
    active,
    toggle: toggleReorder,
    exit: exitReorder,
    listRef,
  } = useMobileReorderMode()

  const fullInFlightIds = useMemo(
    () =>
      orderRowsByGlobalPriority(allRows)
        .filter(holdsGlobalPosition)
        .map((row) => row.goalId),
    [allRows]
  )
  const reorderAvailable = available && fullInFlightIds.length > 1
  // Leaving the list that can be reordered (Archived tab, fewer than two in-flight goals) ends the
  // mode, so the mobile Done bar is never left pinned over a list that has no handles.
  useEffect(() => {
    if (!reorderAvailable) exitReorder()
  }, [reorderAvailable, exitReorder])
  const handleReorder = (visibleOrderedIds: string[], movedId: string) => {
    const displaced = displacedByDrop(
      fullInFlightIds,
      visibleOrderedIds,
      movedId
    )
    if (displaced !== undefined) {
      void orderActions.moveGoal({
        goalId: movedId,
        displacedGoalId: displaced,
      })
    }
  }

  return {
    orderActions,
    handleReorder,
    reorderAvailable,
    reorderActive: active && reorderAvailable,
    toggleReorder,
    exitReorder,
    listRef,
  }
}
