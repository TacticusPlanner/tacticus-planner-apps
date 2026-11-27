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

import { CreateGoalButton, useGlobalGoalPlan } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import {
  ProjectSelect,
  useProjects,
  useSelectedProjectId,
} from "@/entities/project"
import { usePlanInsights } from "@/features/goal-planning"
import { EmptyState, PageToolbar, SegmentedControl } from "@/shared/ui"
import { InsightsCampaignProgression } from "./insights-campaign-progression"
import { InsightsEvents } from "./insights-events"
import { InsightsHoldingBack } from "./insights-holding-back"
import { InsightsMissing } from "./insights-missing"
import { InsightsOutlook } from "./insights-outlook"
import { useInsightsTutorial } from "./insights-page.tutorial"
import type { InsightsGoalInfo } from "../../model/insights/insights-view"

/** Which nodes "Best campaigns/events to farm" rank over. */
const INSIGHTS_LOCATIONS = ["reached", "all"] as const
type InsightsLocations = (typeof INSIGHTS_LOCATIONS)[number]

/**
 * The Insights view (plan §16 phase 7): when the plan is done and which goals set that date, what
 * holds it back (blockers and farming bottlenecks), where to farm (campaign/event relevance annotated
 * with which entities benefit), and everything still missing. Defaults to every Active goal in the global plan; its
 * optional project filter is the shared, remembered one Dailies and Schedule use, kept independent of `GoalsPage`'s
 * URL project scope.
 */
export function InsightsPage() {
  const { t } = useTranslation()
  const projects = useProjects()
  const { settings: planningSettings } = usePlanningSettings()
  // No selection means the whole plan; a project only narrows what is reported. The selection is the
  // one shared, remembered project selection (Dailies, Schedule and Insights).
  const [projectId, setProjectId] = useSelectedProjectId(projects)
  // Which nodes the farming cards rank: what the player has reached, or every node.
  const [locations, setLocations] = useState<InsightsLocations>("reached")
  useInsightsTutorial()

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

  const farming = { reached: result, all: result.allLocations }[locations]
  // Only "Reached" can leave the events card empty while the plan still has needs.
  const eventsEmptyText = {
    reached: t("goals.insights.eventsNoneReached"),
    all: undefined,
  }[locations]

  const goalInfoById = new Map<string, InsightsGoalInfo>(
    scopedGoals.map((member) => [
      member.goal.goalId,
      {
        entityType: member.goal.entityType,
        entityId: member.goal.entityId,
        goalType: member.goal.goalType,
        globalPriority: member.goal.globalPriority,
      },
    ])
  )

  return (
    <div className="flex flex-col gap-6" data-testid="insights-page">
      {/* The page toolbar (ui-style-guide rule 2): the project selector in the Find slot, labelled
          at every width (no icon-only toolbar control). */}
      <PageToolbar
        find={
          <ProjectSelect
            allowAll
            onProjectIdChange={setProjectId}
            projectId={projectId}
            projects={projects.projects}
            testId="insights-project-select"
          />
        }
        testId="insights-toolbar"
        view={
          <InsightsLocationsControl
            onValueChange={setLocations}
            value={locations}
          />
        }
      />

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
        <EmptyState
          actions={<CreateGoalButton />}
          description={t("goals.insights.noGoalsDescription")}
          testId="insights-page-empty"
          title={t("goals.insights.noGoalsTitle")}
        />
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
          {/* Read top to bottom: when the plan is done, what holds it back and where to farm, then
              everything still to get. */}
          <InsightsOutlook
            completionDate={result.completionDate}
            dailyEnergy={planningSettings.dailyEnergy}
            energyTotal={result.energyTotal}
            excludedGoals={result.excludedGoals}
            goalInfoById={goalInfoById}
            goalOutlook={result.goalOutlook}
            onslaughtDays={result.onslaughtDays}
          />
          {/* Two columns of similar height: what holds the plan back on the left, where to spend
              energy (farm now, events, campaigns to push) on the right. */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <InsightsHoldingBack
                blockers={result.blockers}
                bottlenecks={result.bottlenecks}
                goalInfoById={goalInfoById}
              />
            </div>
            <div className="flex flex-col gap-6" data-testid="insights-farming">
              <InsightsEvents
                benefitingGoalIdsByInsightId={
                  farming.benefitingGoalIdsByInsightId
                }
                farmingSpotsByInsightId={farming.farmingSpotsByInsightId}
                goalInfoById={goalInfoById}
                insights={farming.campaignInsights}
                title={t("goals.insights.campaignsTitle")}
              />
              <InsightsEvents
                benefitingGoalIdsByInsightId={
                  farming.benefitingGoalIdsByInsightId
                }
                farmingSpotsByInsightId={farming.farmingSpotsByInsightId}
                goalInfoById={goalInfoById}
                description={t("goals.insights.eventsDescription")}
                emptyText={eventsEmptyText}
                insights={farming.eventInsights}
                title={t("goals.insights.eventsTitle")}
              />
              <InsightsCampaignProgression
                campaigns={result.campaignProgression}
              />
            </div>
          </div>
          <InsightsMissing
            goalInfoById={goalInfoById}
            missing={result.missing}
            projectId={projectId}
            spareUpgrades={result.spareUpgrades}
            totals={result.totals}
            upgrades={result.upgradeMaterials}
          />
        </>
      )}
    </div>
  )
}

/** The View slot's Locations switch: rank farming over reached nodes or every node. */
function InsightsLocationsControl({
  value,
  onValueChange,
}: {
  value: InsightsLocations
  onValueChange: (value: InsightsLocations) => void
}) {
  const { t } = useTranslation()
  return (
    <SegmentedControl
      label={t("goals.insights.locations.label")}
      onValueChange={onValueChange}
      options={INSIGHTS_LOCATIONS.map((option) => ({
        value: option,
        label: t(`goals.insights.locations.${option}`),
        hint: t(`goals.insights.locations.${option}Hint`),
        testId: `insights-locations-${option}`,
      }))}
      testId="insights-locations"
      value={value}
    />
  )
}
