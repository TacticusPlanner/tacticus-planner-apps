import { useProjectCardOutlooks } from "@/features/goal-planning"
import { withCardProgress } from "@/features/project-management"

import { ProjectsWidgetList } from "./projects-widget-list"
import type { ProjectsWidgetListProps } from "./projects-widget-list"

/** The project rows with their "Done by" and targeted cards' deadline fit counts
 * (project-deadline-fit). Loaded lazily so the plan engine stays out of the Home route's startup
 * bundle; the plan runs only when a listed project holds a goal. */
export function ProjectsWidgetFitList(
  props: Omit<ProjectsWidgetListProps, "fitCounts">
) {
  const { fitCounts, progress } = useProjectCardOutlooks(props.projects)
  return (
    <ProjectsWidgetList
      {...props}
      fitCounts={fitCounts}
      summaries={withCardProgress(props.summaries, progress)}
    />
  )
}
