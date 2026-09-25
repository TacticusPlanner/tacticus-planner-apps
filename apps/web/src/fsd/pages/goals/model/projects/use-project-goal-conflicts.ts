import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { goalQueries, goalRankTargetKey, type GoalKind } from "@/entities/goal"
import { projectQueries, type ProjectSummary } from "@/entities/project"
import type { ProjectMembershipConflict } from "./project-membership"

type ProjectGoalEntry = {
  goal: {
    goalId: string
    entityType: string
    entityId: string
    goalType: string
    status: string
  }
}

const isInFlight = (status: string) =>
  status === "Active" || status === "Paused"

/**
 * Project-scoped slot conflicts for a goal about to be created or edited. Non-Rank goal types conflict
 * per `(unit, goalType)`; a Rank goal conflicts only with an in-flight Rank goal for the same unit that
 * has the *same normalized end target* (`rankTargetKey`) — distinct Rank targets coexist. A project's
 * goal list only carries summaries, so the existing Rank goals' targets are read from their details
 * (cached across the Goals page); `loading` covers both fetches. The server stays authoritative when a
 * conflict appears after this check.
 */
export function useProjectGoalConflicts({
  projects,
  selectedProjectIds,
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
  rankTargetKey,
  enabled = true,
}: {
  projects: ProjectSummary[]
  selectedProjectIds: string[]
  entityType: "Character" | "Mow"
  entityId: string | undefined
  goalTypes: GoalKind[]
  excludeGoalId?: string
  /** The normalized end target of the Rank goal being placed; null/undefined when there is none. */
  rankTargetKey?: string | null
  enabled?: boolean
}) {
  const selected = projects.filter((project) =>
    selectedProjectIds.includes(project.projectId)
  )
  const active = Boolean(enabled && entityId && goalTypes.length > 0)
  const queries = useQueries({
    queries: selected.map((project) => ({
      ...projectQueries.goals(project.projectId),
      enabled: active,
    })),
  })

  const projectGoals = queries.map((query) => query.data?.goals ?? [])
  // A stable dependency for "some project's goal list changed" - the number of selected projects varies,
  // so the lists themselves can't be spread into a dependency array.
  const projectGoalsVersion = queries
    .map((query) => query.dataUpdatedAt)
    .join(",")
  const rankGoalIds = useMemo(
    () =>
      rankTargetKey && entityId && goalTypes.includes("Rank")
        ? [
            ...new Set(
              queries.flatMap((query) =>
                (query.data?.goals ?? [])
                  .filter(
                    (entry) =>
                      entry.goal.entityType === entityType &&
                      entry.goal.entityId === entityId &&
                      entry.goal.goalType === "Rank" &&
                      entry.goal.goalId !== excludeGoalId &&
                      isInFlight(entry.goal.status)
                  )
                  .map((entry) => entry.goal.goalId)
              )
            ),
          ]
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rankTargetKey,
      entityId,
      entityType,
      excludeGoalId,
      goalTypes,
      projectGoalsVersion,
    ]
  )
  const detailQueries = useQueries({
    queries: rankGoalIds.map((goalId) => ({
      ...goalQueries.detail(goalId),
      enabled: active,
    })),
  })
  const rankKeyByGoalId = useMemo(() => {
    const keys = new Map<string, string>()
    for (const query of detailQueries) {
      const key = query.data ? goalRankTargetKey(query.data) : null
      if (query.data && key) keys.set(query.data.goalId, key)
    }
    return keys
  }, [detailQueries])

  const conflicts = useMemo<ProjectMembershipConflict[]>(() => {
    if (!entityId || goalTypes.length === 0) return []
    return findProjectGoalConflicts({
      selected,
      projectGoals,
      entityType,
      entityId,
      goalTypes,
      excludeGoalId,
      rankTargetKey,
      rankKeyByGoalId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entityId,
    entityType,
    excludeGoalId,
    goalTypes,
    rankTargetKey,
    rankKeyByGoalId,
    selected,
    projectGoalsVersion,
  ])

  return {
    conflicts,
    loading:
      queries.some((query) => query.isPending) ||
      detailQueries.some((query) => query.isPending),
  }
}

export function findProjectGoalConflicts({
  selected,
  projectGoals,
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
  rankTargetKey,
  rankKeyByGoalId,
}: {
  selected: ProjectSummary[]
  projectGoals: ProjectGoalEntry[][]
  entityType: "Character" | "Mow"
  entityId: string
  goalTypes: GoalKind[]
  excludeGoalId?: string
  /** The normalized end target of the Rank goal being placed. Without it no Rank conflict is reported
   *  (the server still rejects an exact duplicate). */
  rankTargetKey?: string | null
  /** Normalized end targets of existing Rank goals, by goal id (from their details). */
  rankKeyByGoalId?: ReadonlyMap<string, string>
}): ProjectMembershipConflict[] {
  return selected.flatMap((project, index) => {
    const matches = (projectGoals[index] ?? []).filter(
      (entry) =>
        entry.goal.entityType === entityType &&
        entry.goal.entityId === entityId &&
        entry.goal.goalId !== excludeGoalId &&
        isInFlight(entry.goal.status) &&
        goalTypes.includes(entry.goal.goalType as GoalKind) &&
        (entry.goal.goalType !== "Rank" ||
          (!!rankTargetKey &&
            rankKeyByGoalId?.get(entry.goal.goalId) === rankTargetKey))
    )
    if (matches.length === 0) return []
    const rankMatch = matches.find((entry) => entry.goal.goalType === "Rank")
    return [
      {
        projectId: project.projectId,
        existingGoalId: matches[0]!.goal.goalId,
        goalTypes: [
          ...new Set(matches.map((entry) => entry.goal.goalType as GoalKind)),
        ],
        rankTargetKey: rankMatch ? (rankTargetKey ?? undefined) : undefined,
      },
    ]
  })
}
