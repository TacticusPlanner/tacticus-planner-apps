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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { GoalStatus } from "@/entities/goal"

import { goalRowFromProjectMember, goalRowFromSummary } from "../model/types"
import { useGoalActions } from "../model/use-goal-actions"
import { useGoals } from "../model/use-goals"
import {
  reorderedMemberIds,
  useProjectActions,
} from "../model/use-project-actions"
import { usePlanEstimate } from "../model/use-plan-estimate"
import { useProjectGoals } from "../model/use-project-goals"
import { useProjects } from "../model/use-projects"
import { CreateGoalSheet } from "./create-goal-sheet"
import { GoalsGrid } from "./goals-grid"
import { GoalsList } from "./goals-list"
import { ProjectToolbar } from "./project-toolbar"

type Tab = "active" | "completed" | "archived"
type View = "list" | "grid"

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const projects = useProjects()
  const goals = useGoals({ archived: tab === "archived" })
  const projectGoals = useProjectGoals(projectId)
  const planEstimate = usePlanEstimate(projectId, projectGoals.goals)

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

  const rows = projectId
    ? projectGoals.goals
        .filter((entry) => matchesTab(entry.goal.status as GoalStatus, tab))
        .map(goalRowFromProjectMember)
    : goals.fetchState.status === "success"
      ? goals.fetchState.goals
          .filter((goal) => tab === "archived" || matchesTab(goal.status, tab))
          .map(goalRowFromSummary)
      : []

  const isLoading = projectId ? projectGoals.loading : goals.isLoading
  const fetchError = projectId
    ? projectGoals.fetchState.status === "error"
      ? projectGoals.fetchState.message
      : null
    : goals.fetchState.status === "error"
      ? goals.fetchState.message
      : null

  const reorderEnabled =
    Boolean(projectId) && tab === "active" && view === "list"

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
    <main
      className="mx-auto flex w-full max-w-400 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="goals-page"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("goals.title")}</h1>
        <Button
          data-testid="goals-page-create-button"
          onClick={() => setIsCreateOpen(true)}
        >
          {t("goals.createButton")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs onValueChange={(value) => setTab(value as Tab)} value={tab}>
          <TabsList>
            <TabsTrigger data-testid="goals-tab-active" value="active">
              {t("goals.tabs.active")}
            </TabsTrigger>
            <TabsTrigger data-testid="goals-tab-completed" value="completed">
              {t("goals.tabs.completed")}
            </TabsTrigger>
            <TabsTrigger data-testid="goals-tab-archived" value="archived">
              {t("goals.tabs.archived")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button
            aria-label={t("goals.view.list")}
            data-testid="goals-view-list"
            onClick={() => setView("list")}
            size="icon-sm"
            variant={view === "list" ? "secondary" : "ghost"}
          >
            <ListIcon />
          </Button>
          <Button
            aria-label={t("goals.view.grid")}
            data-testid="goals-view-grid"
            onClick={() => setView("grid")}
            size="icon-sm"
            variant={view === "grid" ? "secondary" : "ghost"}
          >
            <LayoutGrid />
          </Button>
        </div>
      </div>

      <ProjectToolbar
        onProjectIdChange={setProjectId}
        projectActions={projectActions}
        projectId={projectId}
        projects={projects.projects}
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
            <Button
              data-testid="goals-page-empty-create-button"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              {t("goals.empty.createButton")}
            </Button>
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

      {rows.length > 0 && view === "list" ? (
        <GoalsList
          actions={goalActions}
          estimates={planEstimate.results}
          onMove={handleMove}
          reorderEnabled={reorderEnabled}
          rows={rows}
        />
      ) : null}

      {rows.length > 0 && view === "grid" ? (
        <GoalsGrid
          actions={goalActions}
          estimates={planEstimate.results}
          rows={rows}
        />
      ) : null}

      <CreateGoalSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={refreshCurrentView}
      />
    </main>
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
