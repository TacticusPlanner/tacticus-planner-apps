import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { ProjectColorDot } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"

import type { ProjectCardSummary } from "./project-row"
import type { ProjectCardFitCount } from "./project-fit-count"
import { unitGoalSummaryText } from "../model/unit-goal-summary"
import { ProjectStatusLine } from "./project-status-line"
import { ProjectUnitPortraits } from "./project-unit-portraits"

/** A condensed, identity-only project row for the home dashboard's Your Projects widget: color,
 * name, Default badge, and a units/goals summary — no lifecycle actions (home-projects-widget
 * spec: "Cards in this widget SHALL NOT render lifecycle actions"). The whole row navigates. */
export function ProjectSummaryRow({
  onSelect,
  project,
  summary,
  fitCount,
}: {
  onSelect: () => void
  project: ProjectSummary
  summary: ProjectCardSummary | undefined
  /** The deadline fit count slot (project-deadline-fit), filled by the home page; absent for an
   *  untargeted or ended project. The status line also shows the deadline chip and "Done by". */
  fitCount?: ProjectCardFitCount
}) {
  const { t } = useTranslation()

  return (
    <li>
      <button
        className="flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        data-testid={`home-project-row-${project.projectId}`}
        onClick={onSelect}
        type="button"
      >
        <ProjectColorDot color={project.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{project.name}</span>
            {project.isDefault ? (
              <Badge variant="secondary">
                {t("goals.project.defaultBadge")}
              </Badge>
            ) : null}
          </div>
          {summary?.status === "loading" ? (
            <Skeleton className="mt-2 h-4 w-28" />
          ) : summary?.status === "success" ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {summary.portraitUnits ? (
                <ProjectUnitPortraits
                  total={summary.units}
                  units={summary.portraitUnits}
                />
              ) : null}
              <p>{unitGoalSummaryText(t, summary)}</p>
            </div>
          ) : null}
          {/* Compact: no links, since the whole row is already a button. */}
          <ProjectStatusLine
            compact
            fitCount={fitCount}
            project={project}
            progress={
              summary?.status === "success" ? summary.progress : undefined
            }
            totalGoals={summary?.status === "success" ? summary.goals : 0}
          />
          {summary?.status === "error" ? (
            <p className="mt-1 text-xs text-destructive">
              {t("home.projects.summaryUnavailable")}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  )
}
