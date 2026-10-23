import type { GoalDetail, GoalKind, GoalStatus } from "@/entities/goal"

export type GoalProject = {
  projectId: string
  name: string
  color: string | null
}

/**
 * The row shape the list/grid/actions components render, built from a goals-list entry and its projects
 * (from the goal's `projectIds`); `priority` is the goal's position in the account-wide order.
 */
export type GoalRow = {
  goalId: string
  entityType: string
  entityId: string
  goalType: GoalKind
  status: GoalStatus
  notes: string | null
  updatedAt: string
  dependsOn?: string[]
  priority?: number
  projects?: GoalProject[]
}

export function goalRowFromSummary(
  goal: GoalDetail,
  projects: GoalProject[] = []
): GoalRow {
  return {
    goalId: goal.goalId,
    entityType: goal.entityType,
    entityId: goal.entityId,
    goalType: goal.goalType,
    status: goal.status,
    notes: goal.notes,
    updatedAt: goal.updatedAt,
    dependsOn: goal.dependsOn,
    priority: goal.globalPriority ?? undefined,
    ...(projects.length > 0 ? { projects } : {}),
  }
}
