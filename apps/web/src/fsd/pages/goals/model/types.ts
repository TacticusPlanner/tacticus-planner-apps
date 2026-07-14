import type { GoalKind, GoalStatus, GoalSummary } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"

/**
 * Unified row shape the list/grid/actions components render, regardless of whether the data came from
 * `useGoals` (flat, no project scope) or `useProjectGoals` (project-scoped, carries `priority`).
 */
export type GoalRow = {
  goalId: string
  entityType: string
  entityId: string
  goalType: GoalKind
  status: GoalStatus
  priority?: number
  milestonesTotal: number
  milestonesCompleted: number
}

export function goalRowFromSummary(goal: GoalSummary): GoalRow {
  return {
    goalId: goal.goalId,
    entityType: goal.entityType,
    entityId: goal.entityId,
    goalType: goal.goalType,
    status: goal.status,
    milestonesTotal: goal.milestonesTotal,
    milestonesCompleted: goal.milestonesCompleted,
  }
}

export function goalRowFromProjectMember(entry: ProjectGoalSummary): GoalRow {
  return {
    goalId: entry.goal.goalId,
    entityType: entry.goal.entityType,
    entityId: entry.goal.entityId,
    goalType: entry.goal.goalType as GoalKind,
    status: entry.goal.status as GoalStatus,
    priority: entry.priority,
    milestonesTotal: entry.goal.milestonesTotal,
    milestonesCompleted: entry.goal.milestonesCompleted,
  }
}
