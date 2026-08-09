import type { ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"
import { ProjectRow, type ProjectCardSummary } from "./project-row"

type Props = {
  projects: ProjectSummary[]
  actions: ReturnType<typeof useProjectActions>
  onEdit: (project: ProjectSummary) => void
  onSelect: (project: ProjectSummary) => void
  summaries?: ReadonlyMap<string, ProjectCardSummary>
}

/**
 * The Projects list route's permanent, inline project list (project-management spec: "The list
 * route shows every project without its goal table") - every non-deleted project, active and
 * archived, as its own row (`ProjectRow`). Activating a row outside its action icons navigates to
 * that project's detail route via `onSelect`; the icons themselves never do.
 */
export function ProjectList({
  projects,
  actions,
  onEdit,
  onSelect,
  summaries,
}: Props) {
  return (
    <ul className="grid gap-3 md:grid-cols-2" data-testid="project-list">
      {projects.map((project) => (
        <ProjectRow
          actions={actions}
          key={project.projectId}
          onEdit={onEdit}
          onSelect={() => onSelect(project)}
          project={project}
          summary={summaries?.get(project.projectId)}
        />
      ))}
    </ul>
  )
}
