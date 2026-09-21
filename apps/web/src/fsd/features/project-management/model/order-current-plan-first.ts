import type { ProjectSummary } from "@/entities/project"

/** Current plan first, then other non-archived projects in their existing order — the ordering
 * `home-projects-widget` and `overview-project-quicknav` both apply to a raw project list before
 * capping or rendering it. Archived projects are dropped entirely, Current plan included. */
export function orderCurrentPlanFirst(
  projects: ProjectSummary[]
): ProjectSummary[] {
  const current = projects.find((project) => project.isActivePlan)
  const others = projects.filter(
    (project) => !project.isActivePlan && project.status !== "Archived"
  )
  return current ? [current, ...others] : others
}
