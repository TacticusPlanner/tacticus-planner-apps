import { useProjectFitCounts } from "@/features/goal-planning"

import { ProjectsWidgetList } from "./projects-widget-list"
import type { ProjectsWidgetListProps } from "./projects-widget-list"

/** The project rows with targeted cards' deadline fit counts (project-deadline-fit). Loaded lazily
 * so the plan engine stays out of the Home route's startup bundle; the plan runs only when a
 * listed project has a resolvable, not-ended target. */
export function ProjectsWidgetFitList(
  props: Omit<ProjectsWidgetListProps, "fitCounts">
) {
  const fitCounts = useProjectFitCounts(props.projects)
  return <ProjectsWidgetList {...props} fitCounts={fitCounts} />
}
