import { useMemo } from "react"

import type { ProjectSummary } from "@/entities/project"

import type { GoalsFetchState } from "../goals-data/use-goals"
import type { GoalProject } from "../shared/types"

/** Each loaded goal's projects, named from the project list. Membership comes with each goal
 *  (`projectIds`); the project list only names the projects. */
export function useProjectsByGoalId(
  projects: readonly ProjectSummary[],
  nonArchived: GoalsFetchState,
  archived: GoalsFetchState
): ReadonlyMap<string, GoalProject[]> {
  return useMemo(() => {
    const byId = new Map(
      projects.map((project) => [
        project.projectId,
        {
          projectId: project.projectId,
          name: project.name,
          color: project.color,
        },
      ])
    )
    const result = new Map<string, GoalProject[]>()
    for (const state of [nonArchived, archived]) {
      if (state.status !== "success") continue
      for (const goal of state.goals) {
        result.set(
          goal.goalId,
          goal.projectIds.flatMap((projectId) => byId.get(projectId) ?? [])
        )
      }
    }
    return result
  }, [projects, nonArchived, archived])
}
