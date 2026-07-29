import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { GoalStatus } from "@/entities/goal"

import { goalRowFromProjectMember } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import {
  reorderedMemberIds,
  useProjectActions,
} from "../../model/projects/use-project-actions"
import { useProjectGoals } from "../../model/projects/use-project-goals"
import { useProjects } from "../../model/projects/use-projects"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { GoalsList } from "../goals-board/goals-list"
import { ProjectToolbar } from ".//project-toolbar"

type Tab = "active" | "completed" | "archived"
const ACTIVE_STATUSES: GoalStatus[] = ["Active", "Paused"]

/** Project-scoped planning view, including priority ordering and bulk project actions. */
export function ProjectsPage() {
  const { t } = useTranslation()
  const projects = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const projectId =
    selectedProjectId ??
    projects.activeProjectId ??
    projects.projects.find((project) => project.status !== "Archived")
      ?.projectId
  const [tab, setTab] = useState<Tab>("active")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const projectGoals = useProjectGoals(projectId)
  const goalActions = useGoalActions()
  const projectActions = useProjectActions()
  const { result: insights } = usePlanInsights(projectId, projectGoals.goals)

  const allRows = projectGoals.goals.map(goalRowFromProjectMember)
  const rows = allRows.filter((row) => matchesTab(row.status, tab))
  const counts = {
    active: allRows.filter((row) => ACTIVE_STATUSES.includes(row.status))
      .length,
    completed: allRows.filter((row) => row.status === "Completed").length,
    archived: allRows.filter((row) => row.status === "Archived").length,
  }

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

  return (
    <div className="flex flex-col gap-6" data-testid="projects-page">
      <div>
        <h1 className="text-2xl font-semibold">{t("goals.project.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("goals.project.pageDescription")}
        </p>
      </div>

      <ProjectToolbar
        onProjectIdChange={setSelectedProjectId}
        projectActions={projectActions}
        projectId={projectId}
        projects={projects.projects}
        requireProject
      />

      {!projectId ? (
        <Card data-testid="projects-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.project.noProjectTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.project.noProjectDescription")}
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs onValueChange={(value) => setTab(value as Tab)} value={tab}>
            <TabsList>
              {(["active", "completed", "archived"] as const).map((value) => (
                <TabsTrigger key={value} value={value}>
                  {t(`goals.tabs.${value}`)} ({counts[value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
              data-testid="projects-page-loading"
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
              onMove={handleMove}
              onView={setDetailGoalId}
              reorderEnabled={tab === "active"}
              rows={rows}
            />
          )}
        </>
      )}

      <GoalDetailSheet
        estimate={
          detailGoalId ? insights.estimates.get(detailGoalId) : undefined
        }
        goalId={detailGoalId}
        isolated={false}
        onOpenChange={(open) => !open && setDetailGoalId(null)}
        onUpdated={projectGoals.retry}
      />
    </div>
  )
}

function matchesTab(status: GoalStatus, tab: Tab) {
  if (tab === "completed") return status === "Completed"
  if (tab === "archived") return status === "Archived"
  return ACTIVE_STATUSES.includes(status)
}
