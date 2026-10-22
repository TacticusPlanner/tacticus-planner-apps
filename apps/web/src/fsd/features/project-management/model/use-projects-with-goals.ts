import { useMemo } from "react"

import { useGoalsById, type GoalDetail } from "@/entities/goal"
import {
  projectGoals,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"

export type ProjectWithGoals = ProjectSummary & { goals: GoalDetail[] }

/**
 * Projects with their member goals joined in memory from the two list reads (spec: goal-project-
 * membership: membership is derived, never fetched per project). Loading until both lists have
 * loaded; an error if either failed, and retry refetches both.
 */
export function useProjectsWithGoals() {
  const projectsRead = useProjects()
  const goalsRead = useGoalsById()

  const projects = useMemo<ProjectWithGoals[]>(
    () =>
      projectsRead.projects.map((project) => ({
        ...project,
        goals: projectGoals(project, goalsRead.goalsById),
      })),
    [projectsRead.projects, goalsRead.goalsById]
  )

  return {
    projects,
    goalsById: goalsRead.goalsById,
    loading: projectsRead.loading || goalsRead.loading,
    isError: projectsRead.fetchState.status === "error" || goalsRead.isError,
    retry: () => {
      projectsRead.retry()
      goalsRead.retry()
    },
    /** The two reads apart, for surfaces that list projects before their goal counts are known. */
    projectsRead,
    goalsRead,
  }
}
