import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import type { GoalKind } from "@/entities/goal"
import { projectQueries, type ProjectSummary } from "@/entities/project"
import type { ProjectMembershipConflict } from "./project-membership"

export function useProjectGoalConflicts({
  projects,
  selectedProjectIds,
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
  enabled = true,
}: {
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  entityType: "Character" | "Mow"
  entityId: string | undefined
  goalTypes: GoalKind[]
  excludeGoalId?: string
  enabled?: boolean
}) {
  const selected = projects.filter((project) =>
    selectedProjectIds.includes(project.projectId)
  )
  const queries = useQueries({
    queries: selected.map((project) => ({
      ...projectQueries.goals(project.projectId),
      enabled: Boolean(enabled && entityId && goalTypes.length > 0),
    })),
  })

  const conflicts = useMemo<ProjectMembershipConflict[]>(() => {
    if (!entityId || goalTypes.length === 0) return []
    return findProjectGoalConflicts({
      selected,
      projectGoals: selected.map(
        (_project, index) => queries[index]?.data?.goals ?? []
      ),
      entityType,
      entityId,
      goalTypes,
      excludeGoalId,
    })
  }, [entityId, entityType, excludeGoalId, goalTypes, queries, selected])

  return {
    conflicts,
    loading: queries.some((query) => query.isPending),
  }
}

export function findProjectGoalConflicts({
  selected,
  projectGoals,
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
}: {
  selected: ProjectSummary[]
  projectGoals: Array<
    Array<{
      goal: {
        goalId: string
        entityType: string
        entityId: string
        goalType: string
        status: string
      }
    }>
  >
  entityType: "Character" | "Mow"
  entityId: string
  goalTypes: GoalKind[]
  excludeGoalId?: string
}): ProjectMembershipConflict[] {
  return selected.flatMap((project, index) => {
    const matches = (projectGoals[index] ?? []).filter(
      (entry) =>
        entry.goal.entityType === entityType &&
        entry.goal.entityId === entityId &&
        entry.goal.goalId !== excludeGoalId &&
        (entry.goal.status === "Active" || entry.goal.status === "Paused") &&
        goalTypes.includes(entry.goal.goalType as GoalKind)
    )
    if (matches.length === 0) return []
    return [
      {
        projectId: project.projectId,
        existingGoalId: matches[0]!.goal.goalId,
        goalTypes: [...new Set(matches.map((entry) => entry.goal.goalType))],
      },
    ]
  })
}
