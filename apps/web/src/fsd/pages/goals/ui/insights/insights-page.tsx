import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useProjectGoals } from "../../model/projects/use-project-goals"
import { useProjects } from "@/entities/project"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { InsightsEvents } from ".//insights-events"
import { InsightsSummary } from ".//insights-summary"

/**
 * The Insights view (plan §16 phase 7): aggregates a project's still-active goals into total missing
 * resources, a combined energy/completion estimate, farming bottlenecks, and campaign/event relevance
 * annotated with which entities benefit. Owns its own project selector (defaulting to the active
 * plan) rather than sharing the goals list's filter via a URL param — kept independent of
 * `GoalsPage`'s existing, separately-tested project-filter state.
 */
export function InsightsPage() {
  const { t } = useTranslation()
  const projects = useProjects()
  // No explicit user choice yet -> default to the active plan, computed on read rather than synced
  // into state via an effect (there is nothing to select from until `projects` loads anyway).
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined)
  const projectId = selectedProjectId ?? projects.activeProjectId

  const projectGoals = useProjectGoals(projectId)
  const { result, loading } = usePlanInsights(projectId, projectGoals.goals)

  const goalEntityById = new Map(
    projectGoals.goals.map((member) => [
      member.goal.goalId,
      { entityType: member.goal.entityType, entityId: member.goal.entityId },
    ])
  )

  return (
    <div className="flex flex-col gap-6" data-testid="insights-page">
      <div className="flex items-center justify-end gap-4">
        <Select onValueChange={setSelectedProjectId} value={projectId}>
          <SelectTrigger className="w-56" data-testid="insights-project-select">
            <SelectValue placeholder={t("goals.insights.selectProject")} />
          </SelectTrigger>
          <SelectContent>
            {projects.projects.map((project) => (
              <SelectItem key={project.projectId} value={project.projectId}>
                {project.name}
                {project.isActivePlan ? ` (${t("goals.project.active")})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!projectId ? (
        <Card data-testid="insights-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.insights.noProjectTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.insights.noProjectDescription")}
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
            bottlenecks={result.bottlenecks}
            completionDate={result.completionDate}
            energyTotal={result.energyTotal}
            onslaughtTokens={result.onslaughtTokens}
            onslaughtDays={result.onslaughtDays}
            totals={result.totals}
          />
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
