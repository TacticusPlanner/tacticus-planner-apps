import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { ProjectSummary } from "@/entities/project"
import { formatEstimateDate, useDateLocale } from "@/shared/lib"

import { ProjectDeadlineChip } from "./project-deadline-chip"
import { ProjectFitCount } from "./project-fit-count"
import type { ProjectCardFitCount } from "./project-fit-count"
import type { ProjectCardStatus } from "./project-row"

/**
 * A live project card's status line (project-management: "Every live project card shows the same
 * facts"), each fact only when it applies: the deadline chip, the fit count, "Done by" (or "No
 * date") with the unestimated count, "2 of 5 reached", and "1 blocked" linking to those goals.
 * `compact` (Home) keeps the chip, the fit count and "Done by", without links.
 */
export function ProjectStatusLine({
  project,
  progress,
  fitCount,
  totalGoals,
  compact = false,
}: {
  project: Pick<ProjectSummary, "projectId" | "name" | "target">
  progress: ProjectCardStatus | undefined
  fitCount: ProjectCardFitCount | undefined
  totalGoals: number
  compact?: boolean
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  if (!project.target && !progress) return null
  const completionText = ({
    completionDate,
    unestimatedGoalCount,
  }: {
    completionDate: string | null
    unestimatedGoalCount: number
  }) =>
    [
      completionDate
        ? t("goals.project.completionSummary", {
            date: formatEstimateDate(completionDate, dateLocale),
          })
        : t("goals.project.noDate"),
      unestimatedGoalCount > 0
        ? t("goals.deadlineFit.header.notEstimated", {
            count: unestimatedGoalCount,
          })
        : null,
    ]
      .filter(Boolean)
      .join(t("goals.deadlineFit.header.separator"))
  const ready = progress?.status === "ready" ? progress : null
  const completion = ready?.completion

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
      data-testid={`project-status-${project.projectId}`}
    >
      {project.target ? (
        <ProjectDeadlineChip
          link={!compact}
          project={project}
          testId={compact ? "home-project-target" : "project-deadline-chip"}
        />
      ) : null}
      {project.target && fitCount ? <ProjectFitCount count={fitCount} /> : null}
      {progress?.status === "loading" ? (
        <Skeleton className="h-4 w-32" data-testid="project-status-loading" />
      ) : null}
      {completion && totalGoals > 0 ? (
        <span data-testid="project-status-completion">
          {completionText(completion)}
        </span>
      ) : null}
      {ready && !compact && totalGoals > 0 ? (
        <span data-testid="project-status-reached">
          {t("goals.project.reachedOf", {
            count: ready.reached,
            total: totalGoals,
          })}
        </span>
      ) : null}
      {ready && !compact && ready.blocked > 0 ? (
        <Link
          aria-label={t("goals.project.blockedLinkLabel", {
            count: ready.blocked,
            name: project.name,
          })}
          className="text-amber-700 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-amber-400"
          data-testid="project-status-blocked"
          to={`/plan/goals?project=${project.projectId}&status=blocked`}
        >
          {t("goals.project.blockedLink", { count: ready.blocked })}
        </Link>
      ) : null}
    </div>
  )
}
