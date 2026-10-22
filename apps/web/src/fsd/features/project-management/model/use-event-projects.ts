import { useIsAuthenticated } from "@azure/msal-react"

import type { ProjectSummary } from "@/entities/project"

import { useProjectsWithGoals } from "./use-projects-with-goals"

/** The projects targeting one Legendary Event: active (and paused) ones listed, archived ones counted
 *  (design D3: archiving keeps a target, the event page lists only active linked projects). */
export function linkedEventProjects<TProject extends ProjectSummary>(
  projects: readonly TProject[],
  eventId: string
): { active: TProject[]; archivedCount: number } {
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
 *  projects read fails, loading while it runs, then each linked project with its goal count from the
 *  goals list (null until it loads). */
export function useEventProjects(eventId: string): EventProjectsState {
  const isAuthenticated = useIsAuthenticated()
  const { projects, projectsRead, goalsRead } = useProjectsWithGoals()
  const { fetchState, loading } = projectsRead
  const { active, archivedCount } = linkedEventProjects(projects, eventId)

  if (!isAuthenticated || fetchState.status === "error") {
    return { status: "hidden" }
  }
  if (loading || fetchState.status !== "success") return { status: "loading" }
  return {
    status: "ready",
    projects: active.map((project) => ({
      project,
      goals:
        goalsRead.loading || goalsRead.isError ? null : project.goals.length,
    })),
    archivedCount,
  }
}
