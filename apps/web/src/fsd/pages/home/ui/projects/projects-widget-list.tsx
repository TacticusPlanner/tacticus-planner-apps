import type { ProjectSummary } from "@/entities/project"
import { ProjectSummaryRow } from "@/features/project-management"
import type { ProjectCardSummary } from "@/features/project-management"
import type { ProjectFitCount } from "@/features/goal-planning"

export type ProjectsWidgetListProps = {
  projects: ProjectSummary[]
  summaries: ReadonlyMap<string, ProjectCardSummary>
  onSelect: (projectId: string) => void
  fitCounts?: ReadonlyMap<string, ProjectFitCount>
}

/** The widget's project rows. Without `fitCounts` it renders no deadline fit counts, which is the
 * Suspense fallback while the plan engine chunk loads. */
export function ProjectsWidgetList({
  projects,
  summaries,
  onSelect,
  fitCounts,
}: ProjectsWidgetListProps) {
  return (
    <ul
      className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1"
      data-testid="home-projects-list"
    >
      {projects.map((project) => (
        <ProjectSummaryRow
          key={project.projectId}
          onSelect={() => onSelect(project.projectId)}
          project={project}
          summary={summaries.get(project.projectId)}
          fitCount={fitCounts?.get(project.projectId)}
        />
      ))}
    </ul>
  )
}
