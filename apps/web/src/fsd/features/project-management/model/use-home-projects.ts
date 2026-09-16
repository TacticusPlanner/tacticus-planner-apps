import { useQueries } from "@tanstack/react-query"

import {
  projectQueries,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"

import type { ProjectCardSummary } from "../ui/project-row"

/** Current plan + up to 2 more non-archived projects (home-projects-widget spec: "Current plan
 * project first ... followed by up to 2 additional non-archived projects (3 project cards
 * total)"). */
const HOME_PROJECT_LIMIT = 3

export type HomeProjectsResult =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready"
      projects: ProjectSummary[]
      summaries: ReadonlyMap<string, ProjectCardSummary>
      remainingCount: number
    }

/** Selects and summarizes the projects the home dashboard's Your Projects widget shows: Current
 * plan first, then other non-archived projects in dashboard order, capped to
 * `HOME_PROJECT_LIMIT`, plus a units/goals summary per visible project. Only computes summaries
 * for the visible (capped) projects, not the whole list. */
export function useHomeProjects(): HomeProjectsResult {
  const { fetchState, loading, projects, retry } = useProjects()

  const current = projects.find((project) => project.isActivePlan)
  const others = projects.filter(
    (project) => !project.isActivePlan && project.status !== "Archived"
  )
  const ordered = current ? [current, ...others] : others
  const visible = ordered.slice(0, HOME_PROJECT_LIMIT)
  const remainingCount = Math.max(0, ordered.length - HOME_PROJECT_LIMIT)

  const summaryQueries = useQueries({
    queries: visible.map((project) => projectQueries.goals(project.projectId)),
  })

  if (loading) return { status: "loading" }
  if (fetchState.status === "error") return { status: "error", retry }
  if (projects.length === 0) return { status: "empty" }

  const summaries = new Map<string, ProjectCardSummary>()
  visible.forEach((project, index) => {
    const query = summaryQueries[index]
    if (!query || query.isPending) {
      summaries.set(project.projectId, { status: "loading" })
      return
    }
    if (query.isError) {
      summaries.set(project.projectId, {
        status: "error",
        retry: () => void query.refetch(),
      })
      return
    }
    const members = query.data.goals
    const units = new Set(
      members
        .filter(
          (entry) =>
            entry.goal.status === "Active" || entry.goal.status === "Paused"
        )
        .map((entry) => `${entry.goal.entityType}:${entry.goal.entityId}`)
    ).size
    summaries.set(project.projectId, {
      status: "success",
      units,
      goals: members.length,
    })
  })

  return { status: "ready", projects: visible, summaries, remainingCount }
}
