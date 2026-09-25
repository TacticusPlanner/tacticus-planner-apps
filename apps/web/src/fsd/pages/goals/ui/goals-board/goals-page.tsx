import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderKanban, Plus, Settings } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  GoalFilters,
  StatusFilterSelect,
  isGoalGroupValue,
  type GoalSortValue,
  type GoalStatusFilterValue,
  type GoalTypeFilterValue,
} from "@/entities/goal"
import { usePersistedSelection } from "@/shared/lib"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { groupRows } from "../../model/shared/row-groups"
import { goalRowFromSummary, type GoalRow } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { useGoalEstimate } from "../../model/estimate/use-goal-estimate"
import { useGoals } from "../../model/goals-data/use-goals"
import { useProjects } from "@/entities/project"
import { useGoalProjects } from "../../model/projects/use-goal-projects"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"
import { GoalsList } from ".//goals-list"
import { OverviewProjectQuicknav } from "./overview-project-quicknav"
import { buildCascadeContext } from "./goal-row-utils"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { PlanningSettingsDialog } from "../settings/planning-settings-dialog"
import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

/** The filter's unfiltered option. Not "no project": every goal always belongs to at least one. */
const ALL_PROJECTS = "__all__"

/**
 * Complete cross-project goals view (plan §1: list on desktop, cards on mobile — no view switcher).
 * Project planning and ordering live on the routed Projects tab. Planning Settings lives only here
 * (goals-navigation spec: Overview-only control) - moved down from the shared `GoalsLayout` wrapper.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<GoalStatusFilterValue>("toReach")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [goalType, setGoalType] = useState<GoalTypeFilterValue>("all")
  const [sort, setSort] = useState<GoalSortValue>("updated")
  // Persisted per browser (see project detail's own group state for the same reasoning) so it
  // survives navigating away and a reload instead of resetting to "none" every time.
  const [group, setGroup] = usePersistedSelection(
    "goals.overview.group",
    isGoalGroupValue,
    "none"
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Membership as a filter dimension, not a project selection: local state only, deliberately
  // unconnected to the Current-plan preference Dailies and Insights calculate against, so browsing
  // Overview never changes what those views operate on.
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS)
  const { getEntityName } = useGoalCatalog()
  const launchCreateGoal = useCreateGoalLauncher()
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
  const { estimate: detailEstimate } = useGoalEstimate(detailGoalId)

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
    candidateRows.map((row) => row.goalId)
  )
  const baseRows =
    tab === "blocked"
      ? candidateRows.filter(
          (row) => overviewMetrics.get(row.goalId)?.blockers.isBlocked
        )
      : candidateRows

  const rows = [...baseRows].sort((left, right) => {
    if (sort === "entity")
      return getEntityName(left.entityType, left.entityId).localeCompare(
        getEntityName(right.entityType, right.entityId)
      )
    if (sort === "type") return left.goalType.localeCompare(right.goalType)
    if (sort === "status") return left.status.localeCompare(right.status)
    if (sort === "updated") return right.updatedAt.localeCompare(left.updatedAt)
    return 0
  })
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
  // Built from every account-wide row (both fetched queries, not the filtered/sorted `rows`), so a
  // prerequisite's status and dependent count are known regardless of the current tab/filter/sort.
  const cascadeContext = useMemo(
    () => buildCascadeContext([...nonArchivedRows, ...archivedRows]),
    [nonArchivedRows, archivedRows]
  )

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
  // goals-navigation spec: this joins the Type/Sort/Group group rather than the status row, and is
  // explicitly not a `ProjectSelect` — it selects no project for any view to operate on.
  const projectFilterLabel =
    projectFilter === ALL_PROJECTS
      ? t("goals.project.filterAll")
      : (projects.projects.find(
          (candidate) => candidate.projectId === projectFilter
        )?.name ?? t("goals.project.filterAll"))
  const projectFilterControl = (
    <Select onValueChange={setProjectFilter} value={projectFilter}>
      <SelectTrigger
        aria-describedby="goals-project-filter-value"
        aria-label={t("goals.project.filterLabel")}
        data-testid="goals-project-filter"
      >
        <FolderKanban />
        {isMobile ? null : <SelectValue />}
        <span className="sr-only" id="goals-project-filter-value">
          {projectFilterLabel}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PROJECTS}>
          {t("goals.project.filterAll")}
        </SelectItem>
        {projects.projects.map((candidate) => (
          <SelectItem key={candidate.projectId} value={candidate.projectId}>
            {candidate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const goalFiltersAndSettings = (
    <div className="flex items-center gap-2" data-testid="goals-filter-group">
      <GoalFilters
        goalType={goalType}
        group={group}
        onGoalTypeChange={setGoalType}
        onGroupChange={setGroup}
        onSortChange={setSort}
        sort={sort}
      />
      {projectFilterControl}
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
      />

      {/* goals-navigation spec: desktop merges the status filter, Type/Sort/Group filters, and
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

      {isLoading ? (
        <div className="flex flex-col gap-3" data-testid="goals-page-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {fetchError ? (
        <div
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          data-testid="goals-page-error"
          role="alert"
        >
          <p className="text-destructive">{fetchError}</p>
          <Button onClick={refreshCurrentView} size="sm" variant="outline">
            {t("goals.retry")}
          </Button>
        </div>
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
              metrics={overviewMetrics}
              onView={setDetailGoalId}
              reachedByGoalId={reachedByGoalId}
              reorderEnabled={false}
              rows={rowGroup.rows}
            />
          </section>
        ) : null
      )}

      <GoalDetailSheet
        estimate={detailEstimate}
        isolated
        goalId={detailGoalId}
        onGoalChange={setDetailGoalId}
        onOpenChange={(open) => !open && setDetailGoalId(null)}
        onUpdated={refreshCurrentView}
      />
      {settingsOpen ? (
        <PlanningSettingsDialog open onOpenChange={setSettingsOpen} />
      ) : null}
    </div>
  )
}
