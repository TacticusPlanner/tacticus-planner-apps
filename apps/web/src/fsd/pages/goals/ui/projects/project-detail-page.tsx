import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  MoreHorizontal,
  Pencil,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import {
  ManageProjectsSheet,
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
import { projectUnitPlans } from "../../model/projects/project-unit-plans"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { GoalsList } from "../goals-board/goals-list"
import { useProjectDetailTutorial } from "./project-detail-page.tutorial"
import { ReprioritizeUnitsSheet } from "./reprioritize-units-sheet"

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
  const [reprioritizeOpen, setReprioritizeOpen] = useState(false)
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
  const units = projectUnitPlans(allRows, overviewMetrics, insights.estimates)
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
      <Card data-testid="project-detail-header">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                aria-label={t("goals.project.backToProjects")}
                onClick={() => void navigate("/goals/projects")}
                size="icon-sm"
                variant="ghost"
              >
                <ArrowLeft />
              </Button>
              <div>
                <CardTitle>{project.name}</CardTitle>
                {project.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.isActivePlan ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {t("goals.project.currentPlan")}
                </span>
              ) : project.status !== "Archived" ? (
                <Button
                  disabled={projectActions.pending}
                  onClick={() =>
                    void projectActions.activate(project.projectId)
                  }
                  variant="outline"
                >
                  {t("goals.project.makeCurrent")}
                </Button>
              ) : null}
              {units.length > 1 ? (
                <Button
                  data-testid="project-reprioritize-units"
                  onClick={() => setReprioritizeOpen(true)}
                >
                  {t("goals.project.reprioritizeUnits")}
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={t("goals.project.moreActions")}
                    size="icon"
                    variant="outline"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil />
                    {t("goals.project.edit")}
                  </DropdownMenuItem>
                  {project.status === "Archived" ? (
                    <DropdownMenuItem
                      onSelect={() =>
                        void projectActions.save(project, {
                          ...project,
                          status: "Active",
                        })
                      }
                    >
                      <ArchiveRestore />
                      {t("goals.project.restore")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled={project.isDefault || project.isActivePlan}
                      onSelect={() =>
                        void projectActions.save(project, {
                          ...project,
                          status: "Archived",
                        })
                      }
                      variant="destructive"
                    >
                      <Archive />
                      {project.isDefault || project.isActivePlan
                        ? t("goals.project.archiveUnavailable")
                        : t("goals.project.archive")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("goals.project.unitGoalSummary", {
              units: units.length,
              goals: allRows.length,
            })}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {t("goals.project.reachedSummary", { count: reachedCount })}
            </span>
            <span>
              {t("goals.project.blockedSummary", { count: blockedCount })}
            </span>
            {insights.completionDate ? (
              <span>
                {t("goals.project.completionSummary", {
                  date: insights.completionDate,
                })}
              </span>
            ) : null}
          </div>
          <ProjectSelect
            onProjectIdChange={(nextId) => {
              if (nextId) void navigate(`/goals/projects/${nextId}`)
            }}
            projectId={projectId}
            projects={projects.projects}
            testId="projects-goal-project-select"
          />
        </CardHeader>
      </Card>

      {/* goals-navigation spec: the project selector is trailing, paired in the same row as the
          status filter - here it switches which project's detail route is shown. */}
      <div className="flex items-center gap-2">
        <StatusFilterSelect
          counts={counts}
          onValueChange={setTab}
          testId="projects-status-filter"
          value={tab}
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

      <div data-testid="project-detail-goals">
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
            onView={setDetailGoalId}
            reorderEnabled={false}
            rows={rows}
          />
        )}
      </div>

      <ManageProjectsSheet
        actions={projectActions}
        onOpenChange={setEditOpen}
        open={editOpen}
        project={project}
      />
      {reprioritizeOpen ? (
        <ReprioritizeUnitsSheet
          onOpenChange={setReprioritizeOpen}
          onSave={(orderedUnits) =>
            projectActions.reorderUnits(project.projectId, orderedUnits)
          }
          open
          pending={projectActions.pending}
          units={units}
        />
      ) : null}
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
