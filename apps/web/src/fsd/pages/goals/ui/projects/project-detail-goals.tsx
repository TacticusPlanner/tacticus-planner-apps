import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { ProjectSummary } from "@/entities/project"
import type { EstimateOutcome } from "@/features/goal-farming"

import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import type { RowGroup } from "../../model/shared/row-groups"
import { GoalsList } from "../goals-board/goals-list"

type Props = {
  actions: ReturnType<typeof useGoalActions>
  estimates: ReadonlyMap<string, EstimateOutcome>
  error: string | null
  getEntityName: (entityType: string, entityId: string) => string
  loading: boolean
  metrics: ReadonlyMap<string, GoalOverviewMetrics>
  onView: (goalId: string) => void
  potentialProgress: ReadonlyMap<string, number>
  project: ProjectSummary
  rowGroups: RowGroup[]
}

/**
 * The detail route's goal content: one labelled block per group, or the error/loading/empty state
 * that stands in for it. Split out of `project-detail-page.tsx` only to keep that file under the
 * lint line cap — the wrapper this renders is what the product tour's "goals" step anchors to, so
 * the group sections stay inside it rather than rendering at top level as Overview's do.
 */
export function ProjectDetailGoals({
  actions,
  estimates,
  error,
  getEntityName,
  loading,
  metrics,
  onView,
  potentialProgress,
  project,
  rowGroups,
}: Props) {
  const { t } = useTranslation()

  return (
    <div data-testid="project-detail-goals">
      {error ? (
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : loading ? (
        <div
          className="flex flex-col gap-3"
          data-testid="project-detail-page-loading"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : rowGroups.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {t("goals.empty.filtered")}
        </p>
      ) : (
        <div className="grid gap-6">
          {rowGroups.map((rowGroup) => (
            <section className="grid gap-2" key={rowGroup.key}>
              {rowGroup.dimension !== "none" ? (
                <h2 className="text-lg font-semibold">
                  {rowGroup.dimension === "type"
                    ? t(`goals.create.goalTypes.${rowGroup.rows[0]!.goalType}`)
                    : getEntityName(
                        rowGroup.rows[0]!.entityType,
                        rowGroup.rows[0]!.entityId
                      )}
                </h2>
              ) : null}
              <GoalsList
                actions={actions}
                estimates={estimates}
                metrics={metrics}
                onView={onView}
                potentialProgress={potentialProgress}
                project={project}
                reorderEnabled={false}
                rows={rowGroup.rows}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
