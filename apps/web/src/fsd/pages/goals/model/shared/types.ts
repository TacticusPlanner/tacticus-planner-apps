import type { GoalKind, GoalStatus, GoalSummary } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"

export type GoalProject = {
  projectId: string
  name: string
  color: string | null
  isActivePlan: boolean
}

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
  notes: string | null
  updatedAt: string
  dependsOn?: string[]
  priority?: number
  projects?: GoalProject[]
}

export function goalRowFromSummary(
  goal: GoalSummary,
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
    ...(projects.length > 0 ? { projects } : {}),
  }
}

export function goalRowFromProjectMember(entry: ProjectGoalSummary): GoalRow {
  return {
    goalId: entry.goal.goalId,
    entityType: entry.goal.entityType,
    entityId: entry.goal.entityId,
    goalType: entry.goal.goalType as GoalKind,
    status: entry.goal.status as GoalStatus,
    notes: entry.goal.notes,
    updatedAt: entry.goal.updatedAt,
    dependsOn: entry.goal.dependsOn,
    priority: entry.priority,
  }
}
