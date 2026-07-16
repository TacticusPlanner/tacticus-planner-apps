import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutGrid, List as ListIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { GoalStatus } from "@/entities/goal"

import { goalRowFromProjectMember, goalRowFromSummary } from "../model/types"
import { useGoalActions } from "../model/use-goal-actions"
import { useGoals } from "../model/use-goals"
import {
  reorderedMemberIds,
  useProjectActions,
} from "../model/use-project-actions"
import { usePlanInsights } from "../model/use-plan-insights"
import { useProjectGoals } from "../model/use-project-goals"
import { useProjects } from "../model/use-projects"
import { useGoalCatalog } from "../model/use-goal-catalog"
import { GoalsGrid } from "./goals-grid"
import { GoalsList } from "./goals-list"
import { GoalDetailSheet } from "./goal-detail-sheet"
import { ProjectToolbar } from "./project-toolbar"

type Tab = "active" | "completed" | "archived"
type View = "list" | "grid"
type Sort = "priority" | "entity" | "type" | "status" | "estimate" | "updated"

const ACTIVE_TAB_STATUSES: GoalStatus[] = ["Draft", "Active", "Paused"]

/**
 * Goals page: Active/Completed/Archived tabs, list⇄grid view toggle, an optional project filter that
 * scopes the goal set (enabling per-project reorder and bulk lifecycle), and per-goal lifecycle actions.
 * See the V2 Goals plan §16 phase 3.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("active")
  const [view, setView] = useState<View>("list")
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [goalType, setGoalType] = useState("all")
  const [sort, setSort] = useState<Sort>("priority")
  const [groupByUnit, setGroupByUnit] = useState(false)
  const { getEntityName } = useGoalCatalog()

  const projects = useProjects()
  const goals = useGoals({ archived: tab === "archived" })
  const archivedGoals = useGoals({ archived: true })
  const projectGoals = useProjectGoals(projectId)
  const { result: planInsights } = usePlanInsights(
    projectId,
    projectGoals.goals
  )

  const refreshCurrentView = () => {
    if (projectId) {
      projectGoals.retry()
    } else {
      goals.retry()
    }
  }

  const goalActions = useGoalActions(refreshCurrentView)
  const projectActions = useProjectActions(() => {
    projects.retry()
    refreshCurrentView()
  })

  const baseRows = projectId
    ? projectGoals.goals
        .filter((entry) => matchesTab(entry.goal.status as GoalStatus, tab))
        .map(goalRowFromProjectMember)
    : goals.fetchState.status === "success"
      ? goals.fetchState.goals
          .filter((goal) => tab === "archived" || matchesTab(goal.status, tab))
          .map(goalRowFromSummary)
      : []

  const rows = baseRows
    .filter((row) => goalType === "all" || row.goalType === goalType)
    .sort((left, right) => {
      if (sort === "entity")
        return getEntityName(left.entityType, left.entityId).localeCompare(
          getEntityName(right.entityType, right.entityId)
        )
      if (sort === "type") return left.goalType.localeCompare(right.goalType)
      if (sort === "status") return left.status.localeCompare(right.status)
      if (sort === "updated")
        return right.updatedAt.localeCompare(left.updatedAt)
      if (sort === "estimate") {
        const a = planInsights.estimates.get(left.goalId)
        const b = planInsights.estimates.get(right.goalId)
        const aDate = a?.status === "Blocked" ? "9999" : (a?.date ?? "9999")
        const bDate = b?.status === "Blocked" ? "9999" : (b?.date ?? "9999")
        return aDate.localeCompare(bDate)
      }
      return (
        (left.priority ?? Number.MAX_SAFE_INTEGER) -
        (right.priority ?? Number.MAX_SAFE_INTEGER)
      )
    })
  const countSourceRows = projectId
    ? projectGoals.goals.map(goalRowFromProjectMember)
    : [
        ...(goals.fetchState.status === "success"
          ? goals.fetchState.goals.map(goalRowFromSummary)
          : []),
        ...(archivedGoals.fetchState.status === "success"
          ? archivedGoals.fetchState.goals
              .filter((goal) => goal.status === "Archived")
              .map(goalRowFromSummary)
          : []),
      ]
  const filteredCountRows = countSourceRows.filter(
    (row) => goalType === "all" || row.goalType === goalType
  )
  const tabCounts = {
    active: filteredCountRows.filter((row) =>
      ACTIVE_TAB_STATUSES.includes(row.status)
    ).length,
    completed: filteredCountRows.filter((row) => row.status === "Completed")
      .length,
    archived: filteredCountRows.filter((row) => row.status === "Archived")
      .length,
  }
  const rowGroups = groupByUnit
    ? [...new Set(rows.map((row) => `${row.entityType}:${row.entityId}`))].map(
        (key) => ({
          key,
          rows: rows.filter(
            (row) => `${row.entityType}:${row.entityId}` === key
          ),
        })
      )
    : [{ key: "all", rows }]

  const isLoading = projectId ? projectGoals.loading : goals.isLoading
  const fetchError = projectId
    ? projectGoals.fetchState.status === "error"
      ? projectGoals.fetchState.message
      : null
    : goals.fetchState.status === "error"
      ? goals.fetchState.message
      : null

  const reorderEnabled =
    Boolean(projectId) &&
    tab === "active" &&
    view === "list" &&
    sort === "priority" &&
    !groupByUnit

  const handleMove = (goalId: string, direction: "up" | "down") => {
    if (!projectId) {
      return
    }

    const orderedIds = reorderedMemberIds(
      projectGoals.goals,
      goalId,
      direction,
      rows.map((row) => row.goalId)
    )
    if (orderedIds) {
      void projectActions.reorder(projectId, orderedIds)
    }
  }

  const showPristineEmptyState =
    tab === "active" &&
    !projectId &&
    !isLoading &&
    !fetchError &&
    rows.length === 0

  return (
    <div className="flex flex-col gap-6" data-testid="goals-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs onValueChange={(value) => setTab(value as Tab)} value={tab}>
          <TabsList>
            <TabsTrigger data-testid="goals-tab-active" value="active">
              {t("goals.tabs.active")}
              {` (${tabCounts.active})`}
            </TabsTrigger>
            <TabsTrigger data-testid="goals-tab-completed" value="completed">
              {t("goals.tabs.completed")}
              {` (${tabCounts.completed})`}
            </TabsTrigger>
            <TabsTrigger data-testid="goals-tab-archived" value="archived">
              {t("goals.tabs.archived")}
              {` (${tabCounts.archived})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button
            aria-label={t("goals.view.list")}
            data-testid="goals-view-list"
            onClick={() => setView("list")}
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
          >
            <ListIcon />
            {t("goals.view.list")}
          </Button>
          <Button
            aria-label={t("goals.view.grid")}
            data-testid="goals-view-grid"
            onClick={() => setView("grid")}
            size="sm"
            variant={view === "grid" ? "secondary" : "ghost"}
          >
            <LayoutGrid />
            {t("goals.view.grid")}
          </Button>
        </div>
      </div>

      <ProjectToolbar
        onProjectIdChange={setProjectId}
        projectActions={projectActions}
        projectId={projectId}
        projects={projects.projects}
      />

      <div className="grid gap-3 md:grid-cols-[12rem_12rem_auto] md:items-center">
        <Select onValueChange={setGoalType} value={goalType}>
          <SelectTrigger data-testid="goals-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("goals.filters.allTypes")}</SelectItem>
            {(["Rank", "Ascension", "Ability", "Unlock"] as const).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {t(`goals.create.goalTypes.${type}`)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSort(value as Sort)} value={sort}>
          <SelectTrigger data-testid="goals-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                "priority",
                "entity",
                "type",
                "status",
                "estimate",
                "updated",
              ] as const
            ).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`goals.filters.sort.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={groupByUnit}
            data-testid="goals-group-by-unit"
            onCheckedChange={setGroupByUnit}
          />
          {t("goals.filters.groupByUnit")}
        </label>
      </div>

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

      {rowGroups.map((group) =>
        group.rows.length > 0 ? (
          <section className="grid gap-2" key={group.key}>
            {group.key !== "all" ? (
              <h2 className="text-lg font-semibold">
                {getEntityName(
                  group.rows[0]!.entityType,
                  group.rows[0]!.entityId
                )}
              </h2>
            ) : null}
            {view === "list" ? (
              <GoalsList
                actions={goalActions}
                estimates={planInsights.estimates}
                onMove={handleMove}
                onView={setDetailGoalId}
                reorderEnabled={reorderEnabled}
                rows={group.rows}
              />
            ) : (
              <GoalsGrid
                actions={goalActions}
                estimates={planInsights.estimates}
                onView={setDetailGoalId}
                rows={group.rows}
              />
            )}
          </section>
        ) : null
      )}

      <GoalDetailSheet
        isolated={!projectId}
        estimate={
          detailGoalId ? planInsights.estimates.get(detailGoalId) : undefined
        }
        goalId={detailGoalId}
        onOpenChange={(open) => !open && setDetailGoalId(null)}
        onUpdated={refreshCurrentView}
      />
    </div>
  )
}

function matchesTab(status: GoalStatus, tab: Tab): boolean {
  if (tab === "completed") {
    return status === "Completed"
  }
  if (tab === "archived") {
    return status === "Archived"
  }
  return ACTIVE_TAB_STATUSES.includes(status)
}
