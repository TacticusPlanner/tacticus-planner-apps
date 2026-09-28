import type { ProjectSummary } from "@/entities/project"

/** The Default project first, then other non-archived projects in their existing order — the ordering
 * `home-projects-widget`, `overview-project-quicknav` and the Projects dashboard all apply to a raw
 * project list before capping or rendering it. Archived projects are dropped entirely. */
export function orderDefaultFirst(
  projects: ProjectSummary[]
): ProjectSummary[] {
  const active = projects.filter((project) => project.status !== "Archived")
  return [
    ...active.filter((project) => project.isDefault),
    ...active.filter((project) => !project.isDefault),
  ]
}
