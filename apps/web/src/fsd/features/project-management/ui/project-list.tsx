import type { ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"
import { ProjectRow } from "./project-row"
import type { ProjectCardSummary } from "./project-row"
import type { ProjectCardFitCount } from "./project-fit-count"

type Props = {
  projects: ProjectSummary[]
  actions: ReturnType<typeof useProjectActions>
  onEdit: (project: ProjectSummary) => void
  onCreateGoal?: (project: ProjectSummary) => void
  onManageGoals?: (project: ProjectSummary) => void
  /** Per project id, whether Move goals… is offered (`enabled`/`disabled`); absent hides it. */
  moveGoals?: ReadonlyMap<string, "enabled" | "disabled">
  onMoveGoals?: (project: ProjectSummary) => void
  onSelect: (project: ProjectSummary) => void
  summaries?: ReadonlyMap<string, ProjectCardSummary>
  /** Deadline fit counts by project id (project-deadline-fit), computed by the page. */
  fitCounts?: ReadonlyMap<string, ProjectCardFitCount>
}

/**
 * The Projects list route's permanent, inline project list (project-management spec: "The list
 * route shows every project without its goal table") - every non-deleted project, active and
 * archived, as its own row (`ProjectRow`). Activating a row outside its action icons opens that
 * project on the Goals page via `onSelect`; the icons themselves never do.
 */
export function ProjectList({
  projects,
  actions,
  onEdit,
  onCreateGoal,
  onManageGoals,
  moveGoals,
  onMoveGoals,
  onSelect,
  summaries,
  fitCounts,
}: Props) {
  return (
    <ul className="grid gap-3 md:grid-cols-2" data-testid="project-list">
      {projects.map((project) => (
        <ProjectRow
          actions={actions}
          key={project.projectId}
          onCreateGoal={onCreateGoal}
          onEdit={onEdit}
          onManageGoals={onManageGoals}
          moveGoals={moveGoals?.get(project.projectId)}
          onMoveGoals={onMoveGoals}
          onSelect={() => onSelect(project)}
          project={project}
          summary={summaries?.get(project.projectId)}
          fitCount={fitCounts?.get(project.projectId)}
        />
      ))}
    </ul>
  )
}
