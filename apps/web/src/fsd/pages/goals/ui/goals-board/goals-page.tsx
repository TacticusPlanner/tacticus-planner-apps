import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  GoalFilters,
  StatusFilterSelect,
  type GoalGroupValue,
  type GoalSortValue,
  type GoalStatusFilterValue,
  type GoalTypeFilterValue,
} from "@/entities/goal"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { goalRowFromSummary } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { useGoalEstimate } from "../../model/estimate/use-goal-estimate"
import { useGoals } from "../../model/goals-data/use-goals"
import { useProjects } from "@/entities/project"
import { useGoalProjects } from "../../model/projects/use-goal-projects"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalsList } from ".//goals-list"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"

/**
 * Complete cross-project goals view (plan §1: list on desktop, cards on mobile — no view switcher).
 * Project planning and ordering live on the routed Projects tab.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<GoalStatusFilterValue>("toReach")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [goalType, setGoalType] = useState<GoalTypeFilterValue>("all")
  const [sort, setSort] = useState<GoalSortValue>("updated")
  const [group, setGroup] = useState<GoalGroupValue>("none")
  const { getEntityName } = useGoalCatalog()

  const projects = useProjects()
  const projectsByGoalId = useGoalProjects(projects.projects)
  const nonArchivedGoals = useGoals()
  const archivedGoals = useGoals({ archived: true })
  const selectedGoals = tab === "archived" ? archivedGoals : nonArchivedGoals
  const refreshCurrentView = selectedGoals.retry

  const nonArchivedGoalIds =
    nonArchivedGoals.fetchState.status === "success"
      ? nonArchivedGoals.fetchState.goals.map((goal) => goal.goalId)
      : []
  // Drives the "Unfulfilled" / "Reached" split (plan §3) — computed from synced player
  // progression, not the goal's lifecycle `status`. Archived goals are excluded: attainment isn't
  // meaningful once a goal has been taken out of active planning.
  const attainmentByGoalId = useGoalAttainment(nonArchivedGoalIds)
  const isReached = (goalId: string) =>
    attainmentByGoalId.get(goalId)?.reached ?? false

  const goalActions = useGoalActions()
  const { estimate: detailEstimate } = useGoalEstimate(detailGoalId)

  const nonArchivedRows =
    nonArchivedGoals.fetchState.status === "success"
      ? nonArchivedGoals.fetchState.goals.map((goal) =>
          goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId))
        )
      : []
  const archivedRows =
    archivedGoals.fetchState.status === "success"
      ? archivedGoals.fetchState.goals
          .filter((goal) => goal.status === "Archived")
          .map((goal) => goalRowFromSummary(goal))
      : []
  const filteredNonArchivedRows = nonArchivedRows.filter(
    (row) => goalType === "all" || row.goalType === goalType
  )
  const filteredArchivedRows = archivedRows.filter(
    (row) => goalType === "all" || row.goalType === goalType
  )

  const baseRows =
    tab === "archived"
      ? filteredArchivedRows
      : filteredNonArchivedRows.filter(
          (row) => isReached(row.goalId) === (tab === "reached")
        )

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
  }
  const groupKey = (row: (typeof rows)[number]) =>
    group === "unit"
      ? `${row.entityType}:${row.entityId}`
      : group === "type"
        ? row.goalType
        : "all"
  const rowGroups = [...new Set(rows.map(groupKey))].map((key) => ({
    key,
    rows: rows.filter((row) => groupKey(row) === key),
  }))
  // Progress bar + remaining-resource summary per visible row (plan §2) — scoped to only the rows
  // actually shown so switching tabs/filters doesn't keep fetching every goal's detail forever.
  const overviewMetrics = useGoalsOverviewMetrics(rows.map((row) => row.goalId))

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

  return (
    <div className="flex flex-col gap-6" data-testid="goals-page">
      <StatusFilterSelect
        counts={tabCounts}
        onValueChange={setTab}
        testId="goals-status-filter"
        value={tab}
      />

      {/* Filter, sort, and grouping stay in a single row on every viewport (plan §1's mobile-controls
          requirement) — on mobile the triggers drop their text label down to just the leading icon,
          keeping the row compact; the full label is still available via `aria-label` and the open
          dropdown's option list always shows full text regardless of viewport. */}
      <GoalFilters
        goalType={goalType}
        group={group}
        onGoalTypeChange={setGoalType}
        onGroupChange={setGroup}
        onSortChange={setSort}
        sort={sort}
      />

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
            {rowGroup.key !== "all" ? (
              <h2 className="text-lg font-semibold">
                {group === "type"
                  ? t(`goals.create.goalTypes.${rowGroup.rows[0]!.goalType}`)
                  : getEntityName(
                      rowGroup.rows[0]!.entityType,
                      rowGroup.rows[0]!.entityId
                    )}
              </h2>
            ) : null}
            <GoalsList
              actions={goalActions}
              metrics={overviewMetrics}
              onView={setDetailGoalId}
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
    </div>
  )
}
