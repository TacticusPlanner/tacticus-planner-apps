import { useIsAuthenticated } from "@azure/msal-react"
import { useQueries } from "@tanstack/react-query"

import {
  projectQueries,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"

/** The projects targeting one Legendary Event: active (and paused) ones listed, archived ones counted
 *  (design D3: archiving keeps a target, the event page lists only active linked projects). */
export function linkedEventProjects(
  projects: readonly ProjectSummary[],
  eventId: string
): { active: ProjectSummary[]; archivedCount: number } {
  const linked = projects.filter(
    (project) =>
      project.target?.kind === "legendaryEvent" &&
      project.target.eventId === eventId
  )
  return {
    active: linked.filter((project) => project.status !== "Archived"),
    archivedCount: linked.filter((project) => project.status === "Archived")
      .length,
  }
}

export type EventProjectsState =
  | { status: "hidden" }
  | { status: "loading" }
  | {
      status: "ready"
      projects: { project: ProjectSummary; goals: number | null }[]
      archivedCount: number
    }

/** The event Overview's Projects line (project-event-target): hidden when signed out or when the
 *  projects read fails, loading while it runs, then each linked project with its goal count (null
 *  until that project's goals load). */
export function useEventProjects(eventId: string): EventProjectsState {
  const isAuthenticated = useIsAuthenticated()
  const { fetchState, loading, projects } = useProjects()
  const { active, archivedCount } = linkedEventProjects(projects, eventId)
  const goalQueries = useQueries({
    queries: active.map((project) => projectQueries.goals(project.projectId)),
  })

  if (!isAuthenticated || fetchState.status === "error") {
    return { status: "hidden" }
  }
  if (loading || fetchState.status !== "success") return { status: "loading" }
  return {
    status: "ready",
    projects: active.map((project, index) => ({
      project,
      goals: goalQueries[index]?.data?.goals.length ?? null,
    })),
    archivedCount,
  }
}
