import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  AddGoalsToProjectSheet,
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"
import { useProjects } from "@/entities/project"
import {
  goalQueries,
  isGoalGroupValue,
  type GoalStatusFilterValue,
} from "@/entities/goal"
import { usePersistedSelection } from "@/shared/lib"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { groupRows } from "../../model/shared/row-groups"
import { useLevelGoalMerges } from "../../model/shared/use-level-goal-merges"
import {
  goalRowFromProjectMember,
  goalRowFromSummary,
} from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { useGoalProjects } from "../../model/projects/use-goal-projects"
import { useProjectGoals } from "../../model/projects/use-project-goals"
import { useProjectGoalReorder } from "../../model/projects/use-project-goal-reorder"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useCreateGoalLauncher } from "../../model/goal-creation-form/create-goal-launcher-context"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import {
  buildCascadeContext,
  isInFlightStatus,
} from "../goals-board/goal-row-utils"
import { ProjectDetailGoals } from "./project-detail-goals"
import { ProjectDetailHeader } from "./project-detail-header"
import { useProjectDetailTutorial } from "./project-detail-page.tutorial"

type Tab = GoalStatusFilterValue

/**
 * A single project's own view (project-management spec: the detail route) - its own row at the
 * top (same presentation/actions as the list route's rows), then its goal table with the shared
 * status filter, the Group control, and a project-switcher `ProjectSelect` that navigates to a
 * different project's own detail route rather than changing state on this page. Unlike Overview,
 * there is no Type filter or Sort control here — every goal type is always shown, always ordered
 * by stored priority (fix-project-priority-display). The route param, not local state, is what
 * project this page shows.
 */
export function ProjectDetailPage() {
  const { t } = useTranslation()
  useProjectDetailTutorial()
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const isAuthenticated = useIsAuthenticated()
  const isMobile = useIsMobile()
  const projects = useProjects()
  const project = projects.projects.find((p) => p.projectId === projectId)

  const [tab, setTab] = useState<Tab>("toReach")
  // Goal type on first-ever visit (project-management: "Goal type is the initial grouping") -
  // Overview keeps "none". Persisted per browser so it survives navigating away and a reload, not
  // just switching between projects while the route stays mounted.
  const [persistedGroup, setGroup] = usePersistedSelection(
    "goals.projectDetail.group",
    isGoalGroupValue,
    "type"
  )
  // relayout-project-detail-controls: this route no longer offers "by unit" - a value persisted
  // from before that removal is clamped to "type" here, at the read site, rather than rewriting the
  // shared `goals.projectDetail.group` storage key (Overview doesn't use "unit" here at all, and a
  // future revert of this change should still see the raw stored value).
  const group = persistedGroup === "unit" ? "type" : persistedGroup
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [mobileReorderActive, setMobileReorderActive] = useState(false)
  const [addGoalsOpen, setAddGoalsOpen] = useState(false)
  const { getEntityName } = useGoalCatalog()
  const launchCreateGoal = useCreateGoalLauncher()

  const projectGoals = useProjectGoals(projectId)
  const goalActions = useGoalActions()
  const projectActions = useProjectActions()
  const { result: insights } = usePlanInsights(projectId, projectGoals.goals)

  // Rows carry their goal's full membership, not just this project's: the row menu's project
  // removal needs to know whether leaving this project is the goal's last membership.
  const projectsByGoalId = useGoalProjects(projects.projects)
  const allRows = projectGoals.goals.map((entry) =>
    goalRowFromProjectMember(entry, projectsByGoalId.get(entry.goal.goalId))
  )
  const nonArchivedRows = allRows.filter((row) => row.status !== "Archived")
  // The account-wide total the project's count is expressed against. `list(false)` excludes archived
  // goals, so the project side must count nonArchivedRows (not allRows) or the two sides would count
  // different sets — a mostly-archived project could otherwise report more goals than the account has.
  const accountGoalsQuery = useQuery({
    ...goalQueries.list(false),
    enabled: isAuthenticated,
  })
  const accountGoalTotal = accountGoalsQuery.data?.goals.length
  // Project detail always shows every goal type (fix-project-priority-display) - there is no Type
  // filter to narrow this by, unlike Goals Overview.
  const filteredAllRows = allRows
  const filteredNonArchivedRows = nonArchivedRows
  const attainmentByGoalId = useGoalAttainment(
    nonArchivedRows.map((row) => row.goalId)
  )
  const isReached = (goalId: string) =>
    attainmentByGoalId.get(goalId)?.reached ?? false
  const reachedByGoalId = useMemo(
    () =>
      new Map(
        nonArchivedRows.map((row) => [
          row.goalId,
          attainmentByGoalId.get(row.goalId)?.reached ?? false,
        ])
      ),
    [nonArchivedRows, attainmentByGoalId]
  )
  // Account-wide, not scoped to this project's own rows: a dependsOn edge isn't constrained by
  // project membership, so a prerequisite or dependent can live in a different project (PR #151
  // review) — reuses the account-wide, non-archived fetch already made above for accountGoalTotal.
  // An Archived goal is absent from this list, but that's harmless for cascade purposes: an id with
  // no entry here already fails cascadeTargets' Active/Paused check the same as an explicit Archived
  // status would, and an archived goal's own dependsOn edges are irrelevant to a still-active
  // sibling's cascade decision. Falls back to this project's own rows only until the account-wide
  // query resolves, rather than disabling the cascade entirely during that window.
  const cascadeContext = useMemo(
    () =>
      buildCascadeContext(
        accountGoalsQuery.data?.goals.map((goal) => goalRowFromSummary(goal)) ??
          allRows
      ),
    [accountGoalsQuery.data, allRows]
  )
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
  // Unit count for the summary text ("N units, M goals") - not a full per-unit plan anymore, since
  // priority is flat per-goal, not unit-grouped (add-inline-goal-reprioritize).
  const inFlightRows = allRows.filter((row) => isInFlightStatus(row.status))
  const unitCount = new Set(
    inFlightRows.map((row) => `${row.entityType}:${row.entityId}`)
  ).size
  const reachedCount = nonArchivedRows.filter((row) =>
    isReached(row.goalId)
  ).length
  const blockedCount = nonArchivedRows.filter(
    (row) => overviewMetrics.get(row.goalId)?.blockers.isBlocked
  ).length
  const baseRows =
    tab === "blocked"
      ? candidateRows.filter(
          (row) => overviewMetrics.get(row.goalId)?.blockers.isBlocked
        )
      : candidateRows
  // Project detail's goal list is always ordered by stored priority (fix-project-priority-display)
  // - there is no Sort control to pick a different order, unlike Goals Overview.
  const rows = [...baseRows].sort(
    (left, right) =>
      (left.priority ?? Number.MAX_SAFE_INTEGER) -
      (right.priority ?? Number.MAX_SAFE_INTEGER)
  )
  const { displayRows, levelGoalIdByParent } = useLevelGoalMerges(rows)
  // Group=Unit is a display-only clustering over the flat, priority-ordered goal list — a cluster's
  // rows keep their priority order, not a separately re-derived dependency-first order
  // (fix-project-priority-display: "Group=Unit clusters the fixed priority order, it doesn't
  // reorder it").
  const rowGroups = groupRows(displayRows, group)
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
  const { handleReorder } = useProjectGoalReorder(projectGoals.goals, (ids) => {
    if (project) void projectActions.reorderGoals(project.projectId, ids)
  })
  if (!projectId) return null
  // One handler for the header button, the three-dot menu and the Add Goals sheet: an explicit
  // project-only prefill, so the sheet never falls back to the default project from here.
  const handleCreateGoal = () => launchCreateGoal({ projectIds: [projectId] })

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
      <ProjectDetailHeader
        accountGoalTotal={accountGoalTotal}
        blockedCount={blockedCount}
        completionDate={insights.completionDate}
        unestimatedGoalCount={insights.unestimatedGoalCount}
        goalCount={nonArchivedRows.length}
        isMobile={isMobile}
        mobileReorderActive={mobileReorderActive}
        onAddGoals={() => setAddGoalsOpen(true)}
        onCreateGoal={handleCreateGoal}
        onEdit={() => setEditOpen(true)}
        onNavigateBack={() => void navigate("/goals/projects")}
        onNavigateToProject={(nextId) =>
          void navigate(`/goals/projects/${nextId}`)
        }
        onToggleMobileReorder={() =>
          setMobileReorderActive((active) => !active)
        }
        project={project}
        projectActions={projectActions}
        projectId={projectId}
        projects={projects.projects}
        reachedCount={reachedCount}
        showMobileReorderToggle={inFlightRows.length > 1}
        unitCount={unitCount}
        group={group}
        onGroupChange={setGroup}
        onStatusFilterChange={setTab}
        statusFilter={tab}
        statusFilterCounts={counts}
      />

      <ProjectDetailGoals
        actions={goalActions}
        cascadeContext={cascadeContext}
        reachedByGoalId={reachedByGoalId}
        error={
          projectGoals.fetchState.status === "error"
            ? projectGoals.fetchState.message
            : null
        }
        estimates={insights.estimates}
        getEntityName={getEntityName}
        loading={projectGoals.loading}
        metrics={overviewMetrics}
        mobileReorderActive={mobileReorderActive}
        onReorder={handleReorder}
        onView={setDetailGoalId}
        potentialProgress={insights.potentialProgressByGoalId}
        project={project}
        projectIsEmpty={allRows.length === 0}
        reorderEnabled={inFlightRows.length > 1}
        levelGoalIdByParent={levelGoalIdByParent}
        reorderPending={projectActions.pending}
        rowGroups={rowGroups}
      />

      <AddGoalsToProjectSheet
        onCreateGoal={handleCreateGoal}
        onOpenChange={setAddGoalsOpen}
        open={addGoalsOpen}
        project={project}
      />
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
