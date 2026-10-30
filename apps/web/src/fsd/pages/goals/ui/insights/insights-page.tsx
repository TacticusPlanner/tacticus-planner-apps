import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useGlobalGoalPlan } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { ProjectSelect, useProjects } from "@/entities/project"
import { usePlanInsights } from "@/features/goal-planning"
import { InsightsEvents } from ".//insights-events"
import { InsightsMissing } from ".//insights-missing"
import { InsightsSummary } from ".//insights-summary"

/**
 * The Insights view (plan §16 phase 7): aggregates a project's still-active goals into total missing
 * resources, a combined energy/completion estimate, farming bottlenecks, and campaign/event relevance
 * annotated with which entities benefit. Defaults to every Active goal in the global plan and owns
 * its own optional project filter rather than sharing the goals list's filter via a URL param — kept independent of
 * `GoalsPage`'s existing, separately-tested project-filter state.
 */
export function InsightsPage() {
  const { t } = useTranslation()
  const projects = useProjects()
  const { settings: planningSettings } = usePlanningSettings()
  // No selection means the whole plan; a project only narrows what is reported.
  const [projectId, setProjectId] = useState<string | undefined>(undefined)

  const globalPlan = useGlobalGoalPlan()
  // A project only narrows the plan by the goals' `projectIds`; no membership read.
  const scopedGoals = projectId
    ? globalPlan.entries.filter((entry) =>
        entry.goal.projectIds.includes(projectId)
      )
    : globalPlan.entries
  // The estimate itself is always the one global run.
  const {
    result,
    loading,
    isError: insightsError,
    retry: retryInsights,
  } = usePlanInsights(
    projectId ? scopedGoals.map((entry) => entry.goal.goalId) : null
  )

  const goalEntityById = new Map(
    scopedGoals.map((member) => [
      member.goal.goalId,
      { entityType: member.goal.entityType, entityId: member.goal.entityId },
    ])
  )

  return (
    <div className="flex flex-col gap-6" data-testid="insights-page">
      {/* goals-navigation spec: a subpage with a project selector but no tab/status row renders it
          right-aligned, alone in its own row. */}
      <div className="flex items-center justify-end gap-4">
        <ProjectSelect
          allowAll
          onProjectIdChange={setProjectId}
          projectId={projectId}
          projects={projects.projects}
          testId="insights-project-select"
        />
      </div>

      {globalPlan.isError || insightsError ? (
        <Card data-testid="insights-page-error">
          <CardHeader>
            <CardTitle>{t("goals.insights.loadError")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={globalPlan.isError ? globalPlan.retry : retryInsights}
              size="sm"
              variant="outline"
            >
              {t("goals.insights.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : !projectId &&
        !globalPlan.loading &&
        globalPlan.active.length === 0 ? (
        <Card data-testid="insights-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.insights.noGoalsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.insights.noGoalsDescription")}
          </CardContent>
        </Card>
      ) : loading ? (
        <div
          className="flex flex-col gap-3"
          data-testid="insights-page-loading"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <InsightsSummary
            blockers={result.blockers}
            bottlenecks={result.bottlenecks}
            completionDate={result.completionDate}
            dailyEnergy={planningSettings.dailyEnergy}
            unestimatedGoalCount={result.unestimatedGoalCount}
            energyTotal={result.energyTotal}
            onslaughtTokens={result.onslaughtTokens}
            onslaughtDays={result.onslaughtDays}
            totals={result.totals}
          />
          <InsightsMissing missing={result.missing} />
          <InsightsEvents
            benefitingGoalIdsByInsightId={result.benefitingGoalIdsByInsightId}
            goalEntityById={goalEntityById}
            insights={result.campaignInsights}
            title={t("goals.insights.campaignsTitle")}
          />
          <InsightsEvents
            benefitingGoalIdsByInsightId={result.benefitingGoalIdsByInsightId}
            goalEntityById={goalEntityById}
            insights={result.eventInsights}
            title={t("goals.insights.eventsTitle")}
          />
        </>
      )}
    </div>
  )
}
