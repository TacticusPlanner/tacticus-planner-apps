import type { ProjectSummary } from "@/entities/project"

import type { ProjectCardSummary } from "../ui/project-row"
import { orderDefaultFirst } from "./order-default-first"
import { useProjectsWithGoals } from "./use-projects-with-goals"

/** Default project + up to 2 more non-archived projects (home-projects-widget spec: "Default
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

/** Selects and summarizes the projects the home dashboard's Your Projects widget shows: Default
 * plan first, then other non-archived projects in dashboard order, capped to `limit` (default
 * `HOME_PROJECT_LIMIT`; pass `null` for no cap, e.g. desktop's roomier layout), plus a
 * units/goals summary per visible project, derived from the goals list (no per-project read): one
 * goals-list failure makes every summary unavailable with one retry.
 *
 * `null`, not `undefined`, means "no cap" - a default *parameter* value is substituted even when
 * a call site passes `undefined` explicitly, so `undefined` can't be repurposed as a distinct
 * "no cap" signal here without every caller matching its exact default by coincidence. */
export function useHomeProjects(
  limit: number | null = HOME_PROJECT_LIMIT
): HomeProjectsResult {
  const {
    projects: withGoals,
    projectsRead,
    goalsRead,
  } = useProjectsWithGoals()
  const { fetchState, loading, retry } = projectsRead

  const ordered = orderDefaultFirst(withGoals)
  const visible = limit === null ? ordered : ordered.slice(0, limit)
  const remainingCount =
    limit === null ? 0 : Math.max(0, ordered.length - limit)

  if (loading) return { status: "loading" }
  if (fetchState.status === "error") return { status: "error", retry }
  if (withGoals.length === 0) return { status: "empty" }

  const summaries = new Map<string, ProjectCardSummary>()
  for (const project of visible) {
    if (goalsRead.loading) {
      summaries.set(project.projectId, { status: "loading" })
      continue
    }
    if (goalsRead.isError) {
      summaries.set(project.projectId, {
        status: "error",
        retry: goalsRead.retry,
      })
      continue
    }
    const inFlightMembers = project.goals.filter(
      (goal) => goal.status === "Active" || goal.status === "Paused"
    )
    const units = new Set(
      inFlightMembers.map((goal) => `${goal.entityType}:${goal.entityId}`)
    ).size
    summaries.set(project.projectId, {
      status: "success",
      units,
      goals: inFlightMembers.length,
    })
  }

  return { status: "ready", projects: visible, summaries, remainingCount }
}
