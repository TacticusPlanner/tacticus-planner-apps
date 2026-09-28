import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Settings } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  GoalFilters,
  StatusFilterSelect,
  isGoalGroupValue,
  type GoalStatusFilterValue,
  type GoalTypeFilterValue,
} from "@/entities/goal"
import { MobileReorderBar, OrderConflictBanner } from "@/features/goal-order"
import { usePersistedSelection } from "@/shared/lib"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { orderRowsByGlobalPriority } from "../../model/shared/goal-row-order"
import { groupRows } from "../../model/shared/row-groups"
import { goalRowFromSummary, type GoalRow } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { useGoals } from "../../model/goals-data/use-goals"
import { GoalsEstimatesError, GoalsFetchError } from "./goals-estimates-error"
import { useGoalsPageReorder } from "../../model/goals-data/use-goals-page-reorder"
import { useProjects } from "@/entities/project"
import { useGoalProjects } from "../../model/projects/use-goal-projects"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"
import { GoalsCreateProjectSheet } from "./goals-create-project-sheet"
import { GoalsList } from ".//goals-list"
import { GoalsMobileReorderToggle } from "./goals-mobile-reorder-toggle"
import { ALL_PROJECTS, ProjectFilterSelect } from "./goals-project-filter"
import { OverviewProjectQuicknav } from "./overview-project-quicknav"
import { buildCascadeContext } from "./goal-row-utils"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { PlanningSettingsDialog } from "../settings/planning-settings-dialog"
import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

/**
 * The Goals page (plan §1: list on desktop, cards on mobile — no view switcher): the one list of
 * every goal and the editable global priority order. Goals are always in that order (Active/Paused
 * first, by position; then the rest by recency) — there is no other sort — and each Active/Paused
 * row can be dragged (a dedicated mode on mobile). A drop is saved on its own as a single move, so
 * it works under any status/type/project filter and Group: the goal takes the global position of the
 * goal it displaces and hidden goals keep their relative order. Estimates come from the same plan
 * run Today uses. Planning Settings lives only here (goals-navigation spec) - moved down from the
 * shared `GoalsLayout` wrapper.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<GoalStatusFilterValue>("toReach")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [goalType, setGoalType] = useState<GoalTypeFilterValue>("all")
  // Persisted per browser (see project detail's own group state for the same reasoning) so it
  // survives navigating away and a reload instead of resetting to "none" every time.
  const [group, setGroup] = usePersistedSelection(
    "goals.overview.group",
    isGoalGroupValue,
    "none"
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Blank project-creation sheet opened from the project quick-nav; local state so opening,
  // saving or failing never touches the route or the membership filter below.
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  // Membership as a filter dimension, not a project selection: local state only, deliberately
  // unconnected to the project filter Dailies and Insights use, so browsing Goals never changes
  // what those views operate on.
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS)
  const { getEntityName } = useGoalCatalog()
  const launchCreateGoal = useCreateGoalLauncher()
  const insightsRun = usePlanInsights(null)
  const insights = insightsRun.result
  useGoalsOverviewTutorial()

  const projects = useProjects()
  const projectsByGoalId = useGoalProjects(projects.projects)
  const nonArchivedGoals = useGoals()
  const archivedGoals = useGoals({ archived: true })
  const selectedGoals = tab === "archived" ? archivedGoals : nonArchivedGoals
  const refreshCurrentView = selectedGoals.retry

  const nonArchivedGoalIds = useMemo(
    () =>
      nonArchivedGoals.fetchState.status === "success"
        ? nonArchivedGoals.fetchState.goals.map((goal) => goal.goalId)
        : [],
    [nonArchivedGoals.fetchState]
  )
  // Drives the "Unfulfilled" / "Reached" split (plan §3) — computed from synced player
  // progression, not the goal's lifecycle `status`. Archived goals are excluded: attainment isn't
  // meaningful once a goal has been taken out of active planning.
  const attainmentByGoalId = useGoalAttainment(nonArchivedGoalIds)
  const isReached = (goalId: string) =>
    attainmentByGoalId.get(goalId)?.reached ?? false
  const reachedByGoalId = useMemo(
    () =>
      new Map(
        nonArchivedGoalIds.map((id) => [
          id,
          attainmentByGoalId.get(id)?.reached ?? false,
        ])
      ),
    [nonArchivedGoalIds, attainmentByGoalId]
  )

  const goalActions = useGoalActions()

  const nonArchivedRows = useMemo(
    () =>
      nonArchivedGoals.fetchState.status === "success"
        ? nonArchivedGoals.fetchState.goals.map((goal) =>
            goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId))
          )
        : [],
    [nonArchivedGoals.fetchState, projectsByGoalId]
  )
  const archivedRows = useMemo(
    () =>
      archivedGoals.fetchState.status === "success"
        ? archivedGoals.fetchState.goals
            .filter((goal) => goal.status === "Archived")
            .map((goal) =>
              goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId))
            )
        : [],
    [archivedGoals.fetchState, projectsByGoalId]
  )
  const matchesFilters = (row: GoalRow) =>
    (goalType === "all" || row.goalType === goalType) &&
    (projectFilter === ALL_PROJECTS ||
      (row.projects ?? []).some(
        (membership) => membership.projectId === projectFilter
      ))
  const filteredNonArchivedRows = nonArchivedRows.filter(matchesFilters)
  const filteredArchivedRows = archivedRows.filter(matchesFilters)

  // "Blocked" needs every candidate goal's computed blockers to know which ones match, so unlike the
  // other tabs it can't narrow to a final row set before fetching metrics - it fetches metrics for the
  // full non-archived candidate set instead, then filters afterward (see the comment on
  // `GoalStatusFilterCounts` for why this tab has no live count in the dropdown).
  const candidateRows =
    tab === "archived"
      ? filteredArchivedRows
      : tab === "active"
        ? filteredNonArchivedRows.filter((row) => row.status === "Active")
        : tab === "paused"
          ? filteredNonArchivedRows.filter((row) => row.status === "Paused")
          : tab === "blocked"
            ? filteredNonArchivedRows
            : filteredNonArchivedRows.filter(
                (row) => isReached(row.goalId) === (tab === "reached")
              )
  // Progress bar + remaining-resource summary per visible row (plan §2) — scoped to only the rows
  // actually shown so switching tabs/filters doesn't keep fetching every goal's detail forever.
  const overviewMetrics = useGoalsOverviewMetrics(
    candidateRows.map((row) => row.goalId),
    insights.estimates
  )
  const baseRows =
    tab === "blocked"
      ? candidateRows.filter(
          (row) => overviewMetrics.get(row.goalId)?.blockers.isBlocked
        )
      : candidateRows

  const rows = orderRowsByGlobalPriority(baseRows)
  const tabCounts = {
    toReach: filteredNonArchivedRows.filter((row) => !isReached(row.goalId))
      .length,
    reached: filteredNonArchivedRows.filter((row) => isReached(row.goalId))
      .length,
    archived: filteredArchivedRows.length,
    active: filteredNonArchivedRows.filter((row) => row.status === "Active")
      .length,
    paused: filteredNonArchivedRows.filter((row) => row.status === "Paused")
      .length,
  }
  const rowGroups = groupRows(rows, group)
  // Built from every account-wide row (both fetched queries, not the filtered `rows`), so a
  // prerequisite's status and dependent count are known regardless of the current tab/filter.
  const cascadeContext = useMemo(
    () => buildCascadeContext([...nonArchivedRows, ...archivedRows]),
    [nonArchivedRows, archivedRows]
  )

  const {
    orderActions,
    handleReorder,
    reorderAvailable,
    reorderActive,
    toggleReorder,
    exitReorder,
    listRef,
  } = useGoalsPageReorder(nonArchivedRows, tab !== "archived")
  const noFarmableDemand =
    !insightsRun.loading &&
    !insightsRun.isError &&
    insights.estimates.size === 0 &&
    nonArchivedRows.some((row) => row.status === "Active")

  const isLoading = selectedGoals.isLoading
  const fetchError =
    selectedGoals.fetchState.status === "error"
      ? selectedGoals.fetchState.message
      : null

  // "Pristine" means no non-archived goals exist at all — not merely that the current tab/filter
  // combination has no rows, which can also happen when every goal has already been reached or the
  // type filter excludes everything.
  const showPristineEmptyState =
    tab === "toReach" &&
    !isLoading &&
    !fetchError &&
    nonArchivedGoals.fetchState.status === "success" &&
    nonArchivedRows.length === 0

  const createGoalButton = (
    <Button
      aria-label={t("goals.createButton")}
      data-testid="goals-create-goal"
      onClick={() => launchCreateGoal()}
      size="sm"
      variant="outline"
    >
      <Plus data-icon="inline-start" />
      {isMobile ? null : t("goals.createButton")}
    </Button>
  )
  const reorderToggle =
    isMobile && reorderAvailable ? (
      <GoalsMobileReorderToggle
        active={reorderActive}
        onToggle={toggleReorder}
      />
    ) : null
  const planningSettingsButton = (
    <Button
      aria-label={t("goals.planningSettings.button")}
      data-testid="goals-planning-settings"
      onClick={() => setSettingsOpen(true)}
      size="sm"
      variant="outline"
    >
      <Settings data-icon="inline-start" />
      {isMobile ? null : t("goals.planningSettings.button")}
    </Button>
  )
  const goalFiltersAndSettings = (
    <div className="flex items-center gap-2" data-testid="goals-filter-group">
      <GoalFilters
        goalType={goalType}
        group={group}
        onGoalTypeChange={setGoalType}
        onGroupChange={setGroup}
      />
      <ProjectFilterSelect
        onChange={setProjectFilter}
        projects={projects.projects}
        value={projectFilter}
      />
      {reorderToggle}
      {createGoalButton}
      {planningSettingsButton}
    </div>
  )
  const statusFilter = (
    <StatusFilterSelect
      counts={tabCounts}
      onValueChange={setTab}
      testId="goals-status-filter"
      value={tab}
    />
  )

  return (
    <div className="flex flex-col gap-6" data-testid="goals-page">
      {/* overview-project-quicknav spec: a project jump-to row/widget above the control row below -
          not part of goals-navigation's control row itself. */}
      <OverviewProjectQuicknav
        projects={projects.projects}
        projectsFailed={projects.fetchState.status === "error"}
        projectsLoading={projects.loading}
        onCreateProject={() => setCreateProjectOpen(true)}
      />

      {/* goals-navigation spec: desktop merges the status filter, Type/Group filters, and
          Create Goal, and Planning Settings into a single row; mobile keeps the status filter in its own row and
          compresses the filters + Create Goal + Planning Settings to icon-only triggers in a second row. */}
      {isMobile ? (
        <>
          {statusFilter}
          {goalFiltersAndSettings}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter}
          {goalFiltersAndSettings}
        </div>
      )}

      {orderActions.conflict ? (
        <OrderConflictBanner
          onDismiss={orderActions.dismissConflict}
          onRetry={() => void orderActions.retry()}
          retrying={orderActions.pending}
        />
      ) : null}

      {reorderAvailable && rows.length > 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="goals-order-note"
        >
          {t("goals.order.listNote")}
        </p>
      ) : null}

      {insightsRun.isError ? (
        <GoalsEstimatesError onRetry={insightsRun.retry} />
      ) : null}

      {noFarmableDemand ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="goals-no-farmable"
        >
          {t("goals.order.noFarmableDemand")}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-3" data-testid="goals-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {fetchError ? (
        <GoalsFetchError message={fetchError} onRetry={refreshCurrentView} />
      ) : null}

      {showPristineEmptyState ? (
        <Card data-testid="goals-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.empty.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            {t("goals.empty.description")}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading &&
      !fetchError &&
      !showPristineEmptyState &&
      rows.length === 0 ? (
        <p
          className="py-10 text-center text-muted-foreground"
          data-testid="goals-page-filtered-empty"
        >
          {t("goals.empty.filtered")}
        </p>
      ) : null}

      <div
        className="flex flex-col gap-6 outline-none"
        ref={listRef}
        tabIndex={-1}
      >
        {rowGroups.map((rowGroup) =>
          rowGroup.rows.length > 0 ? (
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
                actions={goalActions}
                cascadeContext={cascadeContext}
                estimates={insights.estimates}
                levelPotentialProgress={insights.levelPotentialProgressByGoalId}
                metrics={overviewMetrics}
                mobileReorderActive={reorderActive}
                onReorder={handleReorder}
                onView={setDetailGoalId}
                potentialProgress={insights.potentialProgressByGoalId}
                reachedByGoalId={reachedByGoalId}
                reorderEnabled={reorderAvailable}
                reorderPending={orderActions.pending}
                rows={rowGroup.rows}
              />
            </section>
          ) : null
        )}
      </div>

      {isMobile && reorderActive ? (
        <MobileReorderBar onDone={exitReorder} pending={orderActions.pending} />
      ) : null}

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
        onUpdated={refreshCurrentView}
        potentialRatio={
          detailGoalId
            ? insights.potentialProgressByGoalId.get(detailGoalId)
            : undefined
        }
      />
      <GoalsCreateProjectSheet
        onOpenChange={setCreateProjectOpen}
        open={createProjectOpen}
      />
      {settingsOpen ? (
        <PlanningSettingsDialog open onOpenChange={setSettingsOpen} />
      ) : null}
    </div>
  )
}
