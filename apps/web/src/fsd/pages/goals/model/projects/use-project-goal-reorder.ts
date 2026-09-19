import type { ProjectGoalSummary } from "@/entities/project"
import { spliceGoalOrder } from "./goal-order"

/**
 * Dragging works regardless of which sort/filter/group is currently shown: it's anchored against
 * whichever *visible* neighbor the goal was dropped next to, then spliced into the project's
 * complete in-flight priority order (`projectGoals.goals`, always fetched in true priority order) —
 * not gated on the visible set matching that order itself. See `spliceGoalOrder`.
 */
export function useProjectGoalReorder(
  goals: ProjectGoalSummary[],
  reorderGoals: (goalIds: string[]) => void
) {
  const fullInFlightIds = goals
    .filter(
      (entry) =>
        entry.goal.status === "Active" || entry.goal.status === "Paused"
    )
    .map((entry) => entry.goal.goalId)

  const handleReorder = (visibleOrderedIds: string[], movedId: string) => {
    reorderGoals(spliceGoalOrder(fullInFlightIds, visibleOrderedIds, movedId))
  }

  return { inFlightCount: fullInFlightIds.length, handleReorder }
}
