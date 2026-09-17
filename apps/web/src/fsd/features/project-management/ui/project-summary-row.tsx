import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"

import type { ProjectCardSummary } from "./project-row"

/** A condensed, identity-only project row for the home dashboard's Your Projects widget: color,
 * name, Current-plan badge, and a units/goals summary — no lifecycle actions (home-projects-widget
 * spec: "Cards in this widget SHALL NOT render lifecycle actions"). The whole row navigates. */
export function ProjectSummaryRow({
  onSelect,
  project,
  summary,
}: {
  onSelect: () => void
  project: ProjectSummary
  summary: ProjectCardSummary | undefined
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
            {project.isActivePlan ? (
              <Badge variant="secondary">
                {t("goals.project.currentPlan")}
              </Badge>
            ) : null}
          </div>
          {summary?.status === "loading" ? (
            <Skeleton className="mt-2 h-4 w-28" />
          ) : summary?.status === "success" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("goals.project.unitGoalSummary", summary)}
            </p>
          ) : summary?.status === "error" ? (
            <p className="mt-1 text-xs text-destructive">
              {t("home.projects.summaryUnavailable")}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  )
}
