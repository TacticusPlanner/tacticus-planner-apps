import { useLegendaryEvents } from "@/entities/legendary-event/@x/project"

import type { ProjectSummary } from "../types"
import { resolveProjectDeadline } from "./resolve-project-deadline"
import type {
  ProjectDeadline,
  ProjectDeadlineEvent,
} from "./resolve-project-deadline"

/** Each project's deadline (project-deadline), keyed by project id; untargeted projects are absent.
 *  One catalog read for the whole list, evaluated at the catalog's minute clock. */
export function useProjectDeadlines(
  projects: readonly Pick<ProjectSummary, "projectId" | "target">[]
): ReadonlyMap<string, ProjectDeadline> {
  const events = useLegendaryEvents()
  const catalog: readonly ProjectDeadlineEvent[] | null =
    events.status === "ready" ? events.data : null
  const deadlines = new Map<string, ProjectDeadline>()
  for (const project of projects) {
    if (!project.target) continue
    deadlines.set(
      project.projectId,
      events.status === "error"
        ? { status: "unavailable" }
        : resolveProjectDeadline(project.target, catalog, events.nowMs)
    )
  }
  return deadlines
}

/** One project's deadline, or null when it has no target (or no project is given). */
export function useProjectDeadline(
  project: Pick<ProjectSummary, "projectId" | "target"> | undefined
): ProjectDeadline | null {
  const deadlines = useProjectDeadlines(project ? [project] : [])
  return project ? (deadlines.get(project.projectId) ?? null) : null
}
