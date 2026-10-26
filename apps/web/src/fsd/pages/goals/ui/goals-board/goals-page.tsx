import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  GoalFilters,
  StatusFilterSelect,
  isGoalGroupValue,
} from "@/entities/goal"
import { MobileReorderBar, OrderConflictBanner } from "@/features/goal-planning"
import { PendingMaterialSteps } from "@/features/v1-import"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
  usePlanningSettings,
} from "@/entities/planning-setting"
import { usePersistedSelection } from "@/shared/lib"

import { useGoalAttainmentState } from "@/features/goal-planning"
import { useGoalsOverviewMetrics } from "@/features/goal-planning"
import { usePlanInsights } from "@/features/goal-planning"
import { orderRowsByGlobalPriority } from "@/features/goal-planning"
import { groupRows } from "@/features/goal-planning"
import { goalRowFromSummary, type GoalRow } from "@/features/goal-planning"
import { useProjectsByGoalId } from "@/features/goal-planning"
import { useStableMap } from "@/features/goal-planning"
import { useGoalActions } from "@/features/goal-planning"
import { useGoalsMobileModes } from "@/features/goal-planning"
import { useGoalsSelection } from "@/features/goal-planning"
import { useGoals } from "@/features/goal-planning"
import { useGoalEditParam, useGoalsListFilters } from "@/features/goal-planning"
import { GoalsLateNotices } from "./goals-estimates-error"
import { GoalsPageStates } from "./goals-page-states"
import { useGoalsPageReorder } from "@/features/goal-planning"
import { isGoalsListLoading } from "@/features/goal-planning"
import { useProjects } from "@/entities/project"
import { useGoalCatalog } from "@/features/goal-planning"
import { GoalsList } from ".//goals-list"
import { GoalsBulkControls } from "./goals-bulk-controls"
import { useProjectRemovalFlow } from "./project-removal-flow"
import { GoalsCreateButton } from "./goals-create-button"
import { GoalsToolbar } from "./goals-toolbar"
import { GoalsMobileReorderToggle } from "./goals-mobile-reorder-toggle"
import { GoalsMobileSelectToggle } from "./goals-mobile-select-toggle"
import { MobileSelectBar } from "./mobile-select-bar"
import { GoalsOrderHint } from "./goals-order-hint"
import { GoalsProjectScope } from "./goals-project-scope"
import { useGoalsProjectScope } from "@/features/goal-planning"
import { buildCascadeContext } from "./goal-row-utils"
import { GoalEditDialog } from "@/features/goal-create"
import { PageTourButton } from "@/shared/tour"
import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

/**
 * The Goals page (plan §1: list on desktop, cards on mobile — no view switcher): the one list of
 * every goal and the editable global priority order. Goals are always in that order (Active/Paused
 * first, by position; then the rest by recency) — there is no other sort — and each Active/Paused
 * row can be dragged (a dedicated mode on mobile). A drop is saved on its own as a single move, so
 * it works under any status/type/project filter and Group: the goal takes the global position of the
 * goal it displaces and hidden goals keep their relative order. Estimates come from the same plan
 * run Today uses. Within Goals, Planning Settings lives only here (goals-navigation spec: Projects
 * and Insights render no entry point of their own) - moved down from the shared `GoalsLayout`
 * wrapper. Dailies > Raids (Today) and Plan > Schedule each have its own separate entry point onto the same shared
 * dialog (`expose-planning-settings-from-dailies`); the two never import from each other.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { tab, setTab, goalType, setGoalType } = useGoalsListFilters()
  // Persisted per browser (see project detail's own group state for the same reasoning) so it
  // survives navigating away and a reload instead of resetting to "none" every time.
  const [group, setGroup] = usePersistedSelection(
    "goals.overview.group",
    isGoalGroupValue,
    "none"
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { getEntityName } = useGoalCatalog()
  const insightsRun = usePlanInsights(null)
  const insights = insightsRun.result
  const stableEstimates = useStableMap(insights.estimates)
  const { settings: planningSettings } = usePlanningSettings()
  useGoalsOverviewTutorial()

  const projects = useProjects()
  // Membership as a URL-backed filter dimension (`?project=`), not a project selection: deliberately
  // unconnected to the project filter Dailies and Insights use, so scoping Goals never changes what
  // those views operate on (goals-navigation: "Goals project scope is URL state").
  const scope = useGoalsProjectScope(
    projects.projects,
    projects.fetchState.status === "success"
  )
  const { projectId: scopeId, setProjectId: setScopeId } = scope
  const nonArchivedGoals = useGoals()
  const archivedGoals = useGoals({ archived: true })
  const projectsByGoalId = useProjectsByGoalId(
    projects.projects,
    nonArchivedGoals.fetchState,
    archivedGoals.fetchState
  )
  // The archived query stays for prerequisite cascades only; there is no Archived view any more.
  const selectedGoals = nonArchivedGoals

  const nonArchivedGoalIds = useMemo(
    () =>
      nonArchivedGoals.fetchState.status === "success"
        ? nonArchivedGoals.fetchState.goals.map((goal) => goal.goalId)
        : [],
    [nonArchivedGoals.fetchState]
  )
  const { editGoalId, openEditGoal, closeEditGoal } = useGoalEditParam(
    nonArchivedGoalIds,
    nonArchivedGoals.fetchState.status === "success"
  )
  // Drives the "Unfulfilled" / "Reached" split (plan §3) — computed from synced player
  // progression, not the goal's lifecycle `status`. Archived goals are excluded: attainment isn't
  // meaningful once a goal has been taken out of active planning.
  const { byGoalId: attainmentByGoalId, pending: attainmentPending } =
    useGoalAttainmentState(nonArchivedGoalIds)
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
  // Removal from a project is offered only while the list is scoped to that project.
  const { removal: projectRemoval, dialogs: projectRemovalDialogs } =
    useProjectRemovalFlow({
      actions: goalActions,
      projects: projects.projects,
      project: projects.projects.find(
        (project) => project.projectId === scopeId
      ),
      // A goal's memberships are known once the goals list (its `projectIds`) and the project list
      // (their names) have loaded.
      available:
        projects.fetchState.status === "success" &&
        nonArchivedGoals.fetchState.status === "success",
    })

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
    (!scopeId ||
      (row.projects ?? []).some(
        (membership) => membership.projectId === scopeId
      ))
  const filteredNonArchivedRows = nonArchivedRows.filter(matchesFilters)
  const scopeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of nonArchivedRows)
      for (const membership of row.projects ?? [])
        counts.set(
          membership.projectId,
          (counts.get(membership.projectId) ?? 0) + 1
        )
    return counts
  }, [nonArchivedRows])

  // "Blocked" needs every candidate goal's computed blockers to know which ones match, so unlike the
  // other tabs it can't narrow to a final row set before fetching metrics - it fetches metrics for the
  // full non-archived candidate set instead, then filters afterward (see the comment on
  // `GoalStatusFilterCounts` for why this tab has no live count in the dropdown).
  const candidateRows =
    tab === "active"
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
    stableEstimates,
    insights.rankSlotsByGoalId,
    insights.abilityMaterialsByGoalId,
    insights.planNetByGoalId
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
    active: filteredNonArchivedRows.filter((row) => row.status === "Active")
      .length,
    paused: filteredNonArchivedRows.filter((row) => row.status === "Paused")
      .length,
  }
  const rowGroups = groupRows(rows, group)

  // Selection is page-local and discarded whenever what the list shows changes by user control.
  const {
    selection,
    selectedRows,
    visibleIds,
    onToggleSelected,
    selectAllVisible,
    clearSelection,
  } = useGoalsSelection(rows, [tab, goalType, scopeId, group].join("|"))
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
  } = useGoalsPageReorder(nonArchivedRows)
  const { selectActive, toggleSelect, exitSelect, toggleReorderExclusive } =
    useGoalsMobileModes({
      clearSelection,
      exitReorder,
      reorderActive,
      toggleReorder,
    })
  const isLoading = isGoalsListLoading({
    goalsLoading: selectedGoals.isLoading,
    tab,
    requestedProjectId: scope.requestedProjectId,
    projectsLoading: projects.loading,
    attainmentPending,
    hasCandidateGoals: filteredNonArchivedRows.length > 0,
  })
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
  // The scoped project has no non-archived goals at all (not merely none matching the status/type
  // filters) - goals-navigation: "Scoped Goals adjusts contextual actions and copy".
  const showEmptyProjectState =
    !!scopeId &&
    !isLoading &&
    !fetchError &&
    nonArchivedGoals.fetchState.status === "success" &&
    (scopeCounts.get(scopeId) ?? 0) === 0

  // Always rendered on mobile (disabled when unavailable) so the control row keeps its shape while
  // goals load instead of shifting Create Goal / Planning Settings once the list arrives.
  // (`GoalsToolbar` places them only in its mobile layout.)
  const reorderToggle = (
    <GoalsMobileReorderToggle
      active={reorderActive}
      disabled={isLoading || !reorderAvailable}
      onToggle={toggleReorderExclusive}
    />
  )
  const selectToggle = (
    <GoalsMobileSelectToggle
      active={selectActive}
      disabled={isLoading || rows.length === 0}
      onToggle={toggleSelect}
    />
  )
  const bulkActions = (compact: boolean) => (
    <GoalsBulkControls
      actions={goalActions}
      clearSelection={clearSelection}
      compact={compact}
      projectRemoval={projectRemoval}
      projects={projects.projects}
      reachedByGoalId={reachedByGoalId}
      selectedRows={selectedRows}
    />
  )
  const orderHint =
    reorderAvailable && rows.length > 0 ? (
      <GoalsOrderHint scoped={!!scopeId} />
    ) : null
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
      <GoalsToolbar
        projectScope={
          <GoalsProjectScope
            counts={scopeCounts}
            failed={projects.fetchState.status === "error"}
            loading={projects.loading}
            onSelect={setScopeId}
            projects={projects.projects}
            selectedId={scopeId}
            totalCount={nonArchivedRows.length}
          />
        }
        bulkActions={bulkActions}
        createGoal={<GoalsCreateButton scopeId={scopeId ?? null} />}
        filters={
          <GoalFilters
            goalType={goalType}
            group={group}
            onGoalTypeChange={setGoalType}
            onGroupChange={setGroup}
          />
        }
        orderHint={orderHint}
        planningSettings={
          <PlanningSettingsTrigger
            onClick={() => setSettingsOpen(true)}
            testId="goals-planning-settings"
          />
        }
        reorderToggle={reorderToggle}
        selectToggle={selectToggle}
        statusFilter={statusFilter}
      />

      <PendingMaterialSteps />

      {orderActions.conflict ? (
        <OrderConflictBanner
          onDismiss={orderActions.dismissConflict}
          onRetry={() => void orderActions.retry()}
          retrying={orderActions.pending}
        />
      ) : null}

      <GoalsPageStates
        fetchError={fetchError}
        isLoading={isLoading}
        onRetry={selectedGoals.retry}
        showEmptyProjectState={showEmptyProjectState}
        showFilteredEmpty={rows.length === 0}
        showPristineEmptyState={showPristineEmptyState}
      />

      <div
        className="flex flex-col gap-6 outline-none"
        ref={listRef}
        tabIndex={-1}
      >
        {(isLoading ? [] : rowGroups).map((rowGroup) =>
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
                estimates={stableEstimates}
                levelChargedXp={insights.levelChargedXpByGoalId}
                levelPoolXpAvailable={insights.levelPoolXpAvailableByGoalId}
                levelPotentialProgress={insights.levelPotentialProgressByGoalId}
                metrics={overviewMetrics}
                mobileReorderActive={reorderActive}
                onReorder={handleReorder}
                onEdit={openEditGoal}
                onSelectAllVisible={selectAllVisible}
                onToggleSelected={onToggleSelected}
                potentialProgress={insights.potentialProgressByGoalId}
                projectRemoval={projectRemoval}
                reachedByGoalId={reachedByGoalId}
                reorderEnabled={reorderAvailable}
                reorderPending={orderActions.pending}
                rows={rowGroup.rows}
                selectActive={selectActive}
                selection={selection}
                visibleIds={visibleIds}
                xpBookRarity={planningSettings.xpBookRarity}
              />
            </section>
          ) : null
        )}
      </div>

      <GoalsLateNotices
        hasActiveGoals={nonArchivedRows.some((row) => row.status === "Active")}
        insightsRun={insightsRun}
      />

      {isMobile && reorderActive ? (
        <MobileReorderBar onDone={exitReorder} pending={orderActions.pending} />
      ) : null}

      {isMobile && selectActive ? (
        <MobileSelectBar count={selection.size} onDone={exitSelect}>
          {bulkActions(true)}
        </MobileSelectBar>
      ) : null}

      {projectRemovalDialogs}
      <GoalEditDialog
        goalId={editGoalId}
        onOpenChange={(open) => !open && closeEditGoal()}
        onOpenGoal={openEditGoal}
        headerAction={<PageTourButton />}
      />
      {settingsOpen ? (
        <PlanningSettingsDialog open onOpenChange={setSettingsOpen} />
      ) : null}
    </div>
  )
}
