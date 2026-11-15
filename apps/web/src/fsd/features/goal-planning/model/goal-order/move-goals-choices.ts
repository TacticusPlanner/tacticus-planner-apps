import { inFlightInGlobalOrder } from "@/entities/goal"

import {
  moveProjectGoals,
  projectInFlightGoalIds,
  projectMoveReferences,
} from "./project-moves"
import type { ProjectGoalsPlacement } from "./project-moves"

export type MoveGoalsChoice = "top" | "before" | "after"

type ChoiceGoal = {
  goalId: string
  status: string
  globalPriority: number | null
  projectIds: readonly string[]
}

type ChoiceProject = { projectId: string; name: string; status: string }

/**
 * What the Move goals… dialog offers for one project (project-goal-moves): the goals it moves, the
 * projects Before and After can use, and for a choice whether confirming would change the order.
 */
export function moveGoalsChoices<P extends ChoiceProject>(
  projectId: string,
  projects: readonly P[],
  goals: readonly ChoiceGoal[]
) {
  const movedIds = projectInFlightGoalIds(
    goals.filter((goal) => goal.projectIds.includes(projectId))
  )
  const order = inFlightInGlobalOrder(goals).map((goal) => goal.goalId)
  const references = projectMoveReferences(projects, projectId, goals)

  const placementFor = (
    choice: MoveGoalsChoice,
    referenceId: string | undefined
  ): ProjectGoalsPlacement | null => {
    if (choice === "top") return { kind: "top" }
    if (!referenceId) return null
    const referenceIds = projectInFlightGoalIds(
      goals.filter((goal) => goal.projectIds.includes(referenceId))
    )
    return { kind: choice, referenceIds }
  }

  /** Whether the placement would change the order (To the top is disabled once the block is first). */
  const changes = (placement: ProjectGoalsPlacement | null) => {
    if (!placement) return false
    const next = moveProjectGoals(order, movedIds, placement)
    return next.some((goalId, index) => goalId !== order[index])
  }

  return {
    movedIds,
    references,
    topChanges: changes({ kind: "top" }),
    placementFor,
    changes,
  }
}
