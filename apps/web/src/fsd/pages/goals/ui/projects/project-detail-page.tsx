import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  ManageProjectsSheet,
  ProjectRow,
  reorderedMemberIds,
  useProjectActions,
} from "@/features/project-management"
import { ProjectSelect, useProjects } from "@/entities/project"
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
import { goalRowFromProjectMember } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { useProjectGoals } from "../../model/projects/use-project-goals"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { GoalsList } from "../goals-board/goals-list"
import { useProjectDetailTutorial } from "./project-detail-page.tutorial"

type Tab = GoalStatusFilterValue

/**
 * A single project's own view (project-management spec: the detail route) - its own row at the
 * top (same presentation/actions as the list route's rows), then its goal table with the shared
 * status filter, Type/Sort/Group filters, and a project-switcher `ProjectSelect` that navigates to
 * a different project's own detail route rather than changing state on this page. The route
 * param, not local state, is what project this page shows.
 */
export function ProjectDetailPage() {
  const { t } = useTranslation()
  useProjectDetailTutorial()
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const projects = useProjects()
  const project = projects.projects.find((p) => p.projectId === projectId)

  const [tab, setTab] = useState<Tab>("toReach")
  const [goalType, setGoalType] = useState<GoalTypeFilterValue>("all")
  const [sort, setSort] = useState<GoalSortValue>("updated")
  const [group, setGroup] = useState<GoalGroupValue>("none")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const { getEntityName } = useGoalCatalog()

  const projectGoals = useProjectGoals(projectId)
  const goalActions = useGoalActions()
  const projectActions = useProjectActions()
  const { result: insights } = usePlanInsights(projectId, projectGoals.goals)

  const allRows = projectGoals.goals.map(goalRowFromProjectMember)
  const nonArchivedRows = allRows.filter((row) => row.status !== "Archived")
  const filteredAllRows = allRows.filter(
    (row) => goalType === "all" || row.goalType === goalType
  )
  const filteredNonArchivedRows = nonArchivedRows.filter(
    (row) => goalType === "all" || row.goalType === goalType
  )
  const attainmentByGoalId = useGoalAttainment(
    nonArchivedRows.map((row) => row.goalId)
  )
  const isReached = (goalId: string) =>
    attainmentByGoalId.get(goalId)?.reached ?? false
  // "Blocked" needs every candidate goal's computed blockers to know which ones match, so unlike the
  // other tabs it can't narrow to a final row set before fetching metrics - it fetches metrics for the
  // full non-archived candidate set instead, then filters afterward (see the comment on
  // `GoalStatusFilterCounts` for why this tab has no live count in the dropdown).
  const candidateRows =
    tab === "archived"
      ? filteredAllRows.filter((row) => row.status === "Archived")
      : tab === "active"
        ? filteredNonArchivedRows.filter((row) => row.status === "Active")
        : tab === "paused"
          ? filteredNonArchivedRows.filter((row) => row.status === "Paused")
          : tab === "blocked"
            ? filteredNonArchivedRows
            : filteredNonArchivedRows.filter(
                (row) => isReached(row.goalId) === (tab === "reached")
              )
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
  const counts = {
    toReach: filteredNonArchivedRows.filter((row) => !isReached(row.goalId))
      .length,
    reached: filteredNonArchivedRows.filter((row) => isReached(row.goalId))
      .length,
    archived: filteredAllRows.filter((row) => row.status === "Archived").length,
    active: filteredNonArchivedRows.filter((row) => row.status === "Active")
      .length,
    paused: filteredNonArchivedRows.filter((row) => row.status === "Paused")
      .length,
  }

  // Reordering (up/down) only makes sense while the visible order matches the project's actual
  // priority order - `reorderedMemberIds` swaps positions within *this* row set and submits that
  // as the new priority. Sorting or grouping away from the defaults changes what's visually
  // adjacent without changing priority, so reorder is only offered on the unfiltered, default-sort
  // Unfulfilled view, the same set of conditions that always determined priority order before this
  // page had Sort/Group controls at all.
  const reorderEnabled =
    tab === "toReach" &&
    sort === "updated" &&
    group === "none" &&
    goalType === "all"

  const handleMove = (goalId: string, direction: "up" | "down") => {
    if (!projectId) return
    const orderedIds = reorderedMemberIds(
      projectGoals.goals,
      goalId,
      direction,
      rows.map((row) => row.goalId)
    )
    if (orderedIds) void projectActions.reorder(projectId, orderedIds)
  }

  if (!projectId) return null

  if (projects.loading) {
    return (
      <div className="flex flex-col gap-3" data-testid="project-detail-page">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <Card data-testid="project-detail-page-not-found">
        <CardHeader>
          <CardTitle>{t("goals.project.notFoundTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("goals.project.notFoundDescription")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="project-detail-page"
      data-project-id={projectId}
    >
      <ul className="flex flex-col gap-2">
        <ProjectRow
          actions={projectActions}
          onEdit={() => setEditOpen(true)}
          project={project}
        />
      </ul>

      {/* goals-navigation spec: the project selector is trailing, paired in the same row as the
          status filter - here it switches which project's detail route is shown. */}
      <div className="flex items-center justify-between gap-2">
        <StatusFilterSelect
          counts={counts}
          onValueChange={setTab}
          testId="projects-status-filter"
          value={tab}
        />
        <ProjectSelect
          onProjectIdChange={(nextId) => {
            if (nextId) void navigate(`/goals/projects/${nextId}`)
          }}
          projectId={projectId}
          projects={projects.projects}
          testId="projects-goal-project-select"
        />
      </div>

      <GoalFilters
        goalType={goalType}
        group={group}
        onGoalTypeChange={setGoalType}
        onGroupChange={setGroup}
        onSortChange={setSort}
        sort={sort}
      />

      {projectGoals.fetchState.status === "error" ? (
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          {projectGoals.fetchState.message}
        </div>
      ) : projectGoals.loading ? (
        <div
          className="flex flex-col gap-3"
          data-testid="project-detail-page-loading"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {t("goals.empty.filtered")}
        </p>
      ) : (
        <GoalsList
          actions={goalActions}
          estimates={insights.estimates}
          metrics={overviewMetrics}
          potentialProgress={insights.potentialProgressByGoalId}
          onMove={handleMove}
          onView={setDetailGoalId}
          reorderEnabled={reorderEnabled}
          rows={rows}
        />
      )}

      <ManageProjectsSheet
        actions={projectActions}
        onOpenChange={setEditOpen}
        open={editOpen}
        project={project}
      />
      <GoalDetailSheet
        estimate={
          detailGoalId ? insights.estimates.get(detailGoalId) : undefined
        }
        goalId={detailGoalId}
        isolated={false}
        onGoalChange={setDetailGoalId}
        onOpenChange={(open) => !open && setDetailGoalId(null)}
        onUpdated={projectGoals.retry}
        potentialRatio={
          detailGoalId
            ? insights.potentialProgressByGoalId.get(detailGoalId)
            : undefined
        }
      />
    </div>
  )
}
