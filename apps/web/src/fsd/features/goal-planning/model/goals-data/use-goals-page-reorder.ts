import { useEffect, useMemo, useRef, useState } from "react"

import { holdsGlobalPosition } from "@/entities/goal"
import { useGoalOrderActions } from "../goal-order/use-goal-order-actions"
import { useMobileReorderMode } from "../goal-order/use-mobile-reorder-mode"
import { displacedByDrop } from "../projects/goal-order"
import { orderRowsByGlobalPriority } from "../shared/goal-row-order"
import type { GoalRow } from "../shared/types"

/** How long the moved row stays highlighted. */
const MOVED_HIGHLIGHT_MS = 1500

/**
 * Reordering on the Goals page: turns a drop on the visible (filtered and/or grouped) list into the
 * single move the API takes, resolved against the complete in-flight order so hidden goals keep their
 * relative order, plus the row-menu moves and the mobile reorder mode. Not available when there is
 * nothing to reorder.
 */
export function useGoalsPageReorder(allRows: readonly GoalRow[]) {
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
  const reorderAvailable = fullInFlightIds.length > 1
  // Leaving the list that can be reordered (fewer than two in-flight goals) ends the
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

  // The goal last moved from its row menu: highlighted briefly, and announced at its current
  // position (read from the order as it now stands, so a rolled-back move announces where it is).
  const [lastMovedGoalId, setLastMovedGoalId] = useState<string | null>(null)
  const [highlightedGoalId, setHighlightedGoalId] = useState<string | null>(
    null
  )
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // `goalId` takes the position `displacedGoalId` holds (see `goalMenuMoves`).
  const handleMenuMove = (goalId: string, displacedGoalId: string) => {
    void orderActions.moveGoal({ goalId, displacedGoalId })
    setLastMovedGoalId(goalId)
    setHighlightedGoalId(goalId)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(
      () => setHighlightedGoalId(null),
      MOVED_HIGHLIGHT_MS
    )
  }
  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  return {
    orderActions,
    handleReorder,
    handleMenuMove,
    /** The complete in-flight order (priority N is index N - 1), for `goalMenuMoves`. */
    priorityOrder: fullInFlightIds,
    menuMovePosition:
      lastMovedGoalId && fullInFlightIds.includes(lastMovedGoalId)
        ? {
            position: fullInFlightIds.indexOf(lastMovedGoalId) + 1,
            total: fullInFlightIds.length,
          }
        : null,
    highlightedGoalId,
    reorderAvailable,
    reorderActive: active && reorderAvailable,
    toggleReorder,
    exitReorder,
    listRef,
  }
}
