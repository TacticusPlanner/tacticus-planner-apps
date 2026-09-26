import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpDown, Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useGlobalGoalPlan } from "@/entities/goal"
import { useProjects } from "@/entities/project"
import {
  MobileReorderBar,
  OrderConflictBanner,
  useGoalOrderActions,
  useMobileReorderMode,
} from "@/features/goal-order"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { useGoalProjects } from "../../model/projects/use-goal-projects"
import { goalRowFromSummary } from "../../model/shared/types"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { buildCascadeContext } from "../goals-board/goal-row-utils"
import { GoalsList } from "../goals-board/goals-list"
import { useGlobalPlanTutorial } from "./global-plan-page.tutorial"

/**
 * The Global Plan (`/goals/plan`, spec: `global-goal-priority`): every Active and Paused goal exactly
 * once, in the one account-wide order that Today, Raids Plan, Insights and every estimate consume.
 * Projects are filters over this order, never alternate plans. Reordering is a plain drag (a
 * dedicated mode on mobile); each completed drop is saved on its own, with no confirmation step.
 * Paused goals stay in their position but plan nothing.
 */
export function GlobalPlanPage() {
  const { t } = useTranslation()
  useGlobalPlanTutorial()
  const isMobile = useIsMobile()
  const plan = useGlobalGoalPlan()
  const projects = useProjects()
  const projectsByGoalId = useGoalProjects(projects.projects)
  const goalActions = useGoalActions()
  const orderActions = useGoalOrderActions()
  const {
    active: reorderActive,
    toggle: toggleReorder,
    exit: exitReorder,
    listRef,
  } = useMobileReorderMode()
  const launchCreateGoal = useCreateGoalLauncher()
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const { result: insights, loading: insightsLoading } = usePlanInsights(null)

  const rows = useMemo(
    () =>
      plan.inFlight.map((goal) => ({
        ...goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId)),
        priority: goal.globalPriority ?? undefined,
      })),
    [plan.inFlight, projectsByGoalId]
  )
  const goalIds = rows.map((row) => row.goalId)
  const attainment = useGoalAttainment(goalIds)
  const metrics = useGoalsOverviewMetrics(goalIds, insights.estimates)
  const reachedByGoalId = useMemo(
    () =>
      new Map(
        rows.map((row) => [
          row.goalId,
          attainment.get(row.goalId)?.reached ?? false,
        ])
      ),
    [rows, attainment]
  )
  // Account-wide, so a pause/resume cascade sees prerequisites wherever they live.
  const cascadeContext = useMemo(
    () =>
      buildCascadeContext(plan.goals.map((goal) => goalRowFromSummary(goal))),
    [plan.goals]
  )

  // A drop in the full, unfiltered list: the goal takes the position of the goal that held the place
  // it landed on before the drop.
  const handleReorder = (orderedIds: string[], movedId: string) => {
    const displaced = goalIds[orderedIds.indexOf(movedId)]
    if (displaced !== undefined && displaced !== movedId) {
      void orderActions.moveGoal({
        goalId: movedId,
        displacedGoalId: displaced,
      })
    }
  }

  const hasActiveGoals = plan.active.length > 0
  const noFarmableDemand =
    hasActiveGoals && !insightsLoading && insights.estimates.size === 0

  let body
  if (plan.isError) {
    body = (
      <Card data-testid="global-plan-error">
        <CardContent className="grid justify-items-center gap-3 py-10 text-center">
          <p className="text-destructive" role="alert">
            {t("goals.plan.loadError")}
          </p>
          <Button onClick={plan.retry} variant="outline">
            {t("goals.plan.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  } else if (plan.loading) {
    body = (
      <div className="flex flex-col gap-3" data-testid="global-plan-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  } else if (rows.length === 0) {
    body = (
      <Card data-testid="global-plan-empty">
        <CardContent className="grid justify-items-center gap-3 py-10 text-center">
          <p className="font-medium">{t("goals.plan.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("goals.plan.emptyDescription")}
          </p>
          <Button onClick={() => launchCreateGoal()}>
            <Plus />
            {t("goals.plan.createGoal")}
          </Button>
        </CardContent>
      </Card>
    )
  } else {
    body = (
      <>
        {noFarmableDemand ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="global-plan-no-farmable"
          >
            {t("goals.plan.noFarmableDemand")}
          </p>
        ) : null}
        <div className="outline-none" ref={listRef} tabIndex={-1}>
          <GoalsList
            actions={goalActions}
            cascadeContext={cascadeContext}
            estimates={insights.estimates}
            levelPotentialProgress={insights.levelPotentialProgressByGoalId}
            metrics={metrics}
            mobileReorderActive={reorderActive}
            onReorder={handleReorder}
            onView={setDetailGoalId}
            potentialProgress={insights.potentialProgressByGoalId}
            reachedByGoalId={reachedByGoalId}
            reorderEnabled={rows.length > 1}
            reorderPending={orderActions.pending}
            rows={rows}
          />
        </div>
        {isMobile && reorderActive ? (
          <MobileReorderBar
            onDone={exitReorder}
            pending={orderActions.pending}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="global-plan-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1" data-testid="global-plan-intro">
          <h1 className="text-xl font-semibold">{t("goals.plan.title")}</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t("goals.plan.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-testid="global-plan-create-goal"
            onClick={() => launchCreateGoal()}
            variant="outline"
          >
            <Plus />
            {t("goals.plan.createGoal")}
          </Button>
          {isMobile && rows.length > 1 ? (
            <Button
              aria-pressed={reorderActive}
              data-testid="global-plan-mobile-reorder-toggle"
              onClick={toggleReorder}
              variant={reorderActive ? "default" : "outline"}
            >
              <ArrowUpDown />
              {reorderActive
                ? t("goals.project.reorderDone")
                : t("goals.project.reorderGoals")}
            </Button>
          ) : null}
        </div>
      </div>

      {orderActions.conflict ? (
        <OrderConflictBanner
          onDismiss={orderActions.dismissConflict}
          onRetry={() => void orderActions.retry()}
          retrying={orderActions.pending}
        />
      ) : null}

      {body}

      <GoalDetailSheet
        estimate={
          detailGoalId ? insights.estimates.get(detailGoalId) : undefined
        }
        goalId={detailGoalId}
        isolated={false}
        levelPotentialRatio={
          detailGoalId
            ? insights.levelPotentialProgressByGoalId.get(detailGoalId)
            : undefined
        }
        onGoalChange={setDetailGoalId}
        onOpenChange={(open) => !open && setDetailGoalId(null)}
        onUpdated={plan.retry}
        potentialRatio={
          detailGoalId
            ? insights.potentialProgressByGoalId.get(detailGoalId)
            : undefined
        }
      />
    </div>
  )
}
