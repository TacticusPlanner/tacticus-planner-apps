import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowUpDown,
  Filter,
  Group,
  LayoutGrid,
  List as ListIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { GoalStatus } from "@/entities/goal"

import { goalRowFromSummary } from "../model/types"
import { useGoalActions } from "../model/use-goal-actions"
import { useGoals } from "../model/use-goals"
import { useProjects } from "../model/use-projects"
import { useGoalProjects } from "../model/use-goal-projects"
import { useGoalCatalog } from "../model/use-goal-catalog"
import { GoalsGrid } from "./goals-grid"
import { GoalsList } from "./goals-list"
import { GoalDetailSheet } from "./goal-detail-sheet"

type Tab = "active" | "completed" | "archived"
type View = "list" | "grid"
type Sort = "entity" | "type" | "status" | "updated"
type Group = "none" | "unit" | "type"

const ACTIVE_TAB_STATUSES: GoalStatus[] = ["Draft", "Active", "Paused"]

/**
 * Complete cross-project goals view. Project planning and ordering live on the routed Projects tab.
 */
export function GoalsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("active")
  const [view, setView] = useState<View>("list")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [goalType, setGoalType] = useState("all")
  const [sort, setSort] = useState<Sort>("updated")
  const [group, setGroup] = useState<Group>("none")
  const { getEntityName } = useGoalCatalog()

  const projects = useProjects()
  const projectsByGoalId = useGoalProjects(projects.projects)
  const nonArchivedGoals = useGoals()
  const archivedGoals = useGoals({ archived: true })
  const selectedGoals = tab === "archived" ? archivedGoals : nonArchivedGoals
  const refreshCurrentView = selectedGoals.retry

  const goalActions = useGoalActions()
  const baseRows =
    selectedGoals.fetchState.status === "success"
      ? selectedGoals.fetchState.goals
          .filter((goal) => tab === "archived" || matchesTab(goal.status, tab))
          .map((goal) =>
            goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId))
          )
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
      return 0
    })
  const countSourceRows = [
    ...(nonArchivedGoals.fetchState.status === "success"
      ? nonArchivedGoals.fetchState.goals.map((goal) =>
          goalRowFromSummary(goal, projectsByGoalId.get(goal.goalId))
        )
      : []),
    ...(archivedGoals.fetchState.status === "success"
      ? archivedGoals.fetchState.goals
          .filter((goal) => goal.status === "Archived")
          .map((goal) => goalRowFromSummary(goal))
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

  const isLoading = selectedGoals.isLoading
  const fetchError =
    selectedGoals.fetchState.status === "error"
      ? selectedGoals.fetchState.message
      : null

  const showPristineEmptyState =
    tab === "active" && !isLoading && !fetchError && rows.length === 0

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

      <div className="grid gap-3 md:grid-cols-[12rem_12rem_auto] md:items-center">
        <Select onValueChange={setGoalType} value={goalType}>
          <SelectTrigger data-testid="goals-type-filter">
            <Filter />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("goals.filters.allTypes")}</SelectItem>
            {(
              [
                "Rank",
                "Ascension",
                "Ability",
                "Unlock",
                "Upgrade",
                "UpgradeEquipment",
              ] as const
            ).map((type) => (
              <SelectItem key={type} value={type}>
                {t(`goals.create.goalTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSort(value as Sort)} value={sort}>
          <SelectTrigger data-testid="goals-sort">
            <ArrowUpDown />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["entity", "type", "status", "updated"] as const).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`goals.filters.sort.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setGroup(value as Group)}
          value={group}
        >
          <SelectTrigger data-testid="goals-group-by">
            <Group />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("goals.filters.groupNone")}</SelectItem>
            <SelectItem value="unit">
              {t("goals.filters.groupByUnit")}
            </SelectItem>
            <SelectItem value="type">
              {t("goals.filters.groupByType")}
            </SelectItem>
          </SelectContent>
        </Select>
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
            {view === "list" ? (
              <GoalsList
                actions={goalActions}
                onView={setDetailGoalId}
                reorderEnabled={false}
                rows={rowGroup.rows}
              />
            ) : (
              <GoalsGrid
                actions={goalActions}
                onView={setDetailGoalId}
                rows={rowGroup.rows}
              />
            )}
          </section>
        ) : null
      )}

      <GoalDetailSheet
        estimate={undefined}
        isolated
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
