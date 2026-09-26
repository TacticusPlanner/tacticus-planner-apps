import type { ProjectGoalSummary } from "@/entities/project"
import { spliceGoalOrder } from "./goal-order"

/**
 * Turns a drop on a project's projection into the move the API takes. Dragging works whatever
 * sort/filter/group is shown: the drop is anchored against the *visible* neighbour and spliced into
 * the project's complete in-flight order (`projectGoals.goals`, always fetched in global order) to find
 * where the goal landed — see `spliceGoalOrder`. The goal then takes the global position of the
 * project goal that held that place before the drop (the "displaced" goal); the goals in between, and
 * any hidden goals of other projects, keep their relative order.
 */
export function useProjectGoalReorder(
  goals: ProjectGoalSummary[],
  moveGoal: (goalId: string, displacedGoalId: string) => void
) {
  const fullInFlightIds = goals
    .filter(
      (entry) =>
        entry.goal.status === "Active" || entry.goal.status === "Paused"
    )
    .map((entry) => entry.goal.goalId)

  const handleReorder = (visibleOrderedIds: string[], movedId: string) => {
    const landed = spliceGoalOrder(
      fullInFlightIds,
      visibleOrderedIds,
      movedId
    ).indexOf(movedId)
    const displaced = fullInFlightIds[landed]
    if (displaced !== undefined && displaced !== movedId) {
      moveGoal(movedId, displaced)
    }
  }

  return { inFlightCount: fullInFlightIds.length, handleReorder }
}
