import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { projectQueries, type ProjectSummary } from "@/entities/project"

import type { GoalProject } from "../shared/types"

/** Loads each project's members in parallel and indexes project membership by goal id, plus the
 * ids of the projects whose member list has loaded and of those whose member list is still in
 * flight - so a scoped Goals page can tell "this project has no goals" from "membership is still
 * loading" (a failed member list is neither). */
export function useGoalProjects(projects: ProjectSummary[]) {
  const queries = useQueries({
    queries: projects.map((project) => projectQueries.goals(project.projectId)),
  })

  return useMemo(() => {
    const result = new Map<string, GoalProject[]>()
    const loadedProjectIds = new Set<string>()
    const pendingProjectIds = new Set<string>()

    projects.forEach((project, index) => {
      if (queries[index]?.data) loadedProjectIds.add(project.projectId)
      else if (queries[index]?.isPending)
        pendingProjectIds.add(project.projectId)
      for (const member of queries[index]?.data?.goals ?? []) {
        const memberships = result.get(member.goal.goalId) ?? []
        memberships.push({
          projectId: project.projectId,
          name: project.name,
          color: project.color,
        })
        result.set(member.goal.goalId, memberships)
      }
    })

    return { byGoalId: result, loadedProjectIds, pendingProjectIds }
  }, [projects, queries])
}
