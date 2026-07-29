import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { projectQueries, type ProjectSummary } from "@/entities/project"

import type { GoalProject } from "../shared/types"

/** Loads each project's members in parallel and indexes project membership by goal id. */
export function useGoalProjects(projects: ProjectSummary[]) {
  const queries = useQueries({
    queries: projects.map((project) => projectQueries.goals(project.projectId)),
  })

  return useMemo(() => {
    const result = new Map<string, GoalProject[]>()

    projects.forEach((project, index) => {
      for (const member of queries[index]?.data?.goals ?? []) {
        const memberships = result.get(member.goal.goalId) ?? []
        memberships.push({
          projectId: project.projectId,
          name: project.name,
          color: project.color,
          isActivePlan: project.isActivePlan,
        })
        result.set(member.goal.goalId, memberships)
      }
    })

    return result
  }, [projects, queries])
}
