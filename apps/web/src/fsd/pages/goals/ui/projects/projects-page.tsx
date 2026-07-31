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

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
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

// Mirrors goals-page.tsx's grouping (plan §3): "toReach"/"reached" come from computed attainment,
// never the goal's lifecycle `status`; "archived" stays status-driven.
type Tab = "toReach" | "reached" | "archived"

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
  const [tab, setTab] = useState<Tab>("toReach")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const projectGoals = useProjectGoals(projectId)
  const goalActions = useGoalActions()
  const projectActions = useProjectActions()
  const { result: insights } = usePlanInsights(projectId, projectGoals.goals)

  const allRows = projectGoals.goals.map(goalRowFromProjectMember)
  const nonArchivedRows = allRows.filter((row) => row.status !== "Archived")
  const attainmentByGoalId = useGoalAttainment(
    nonArchivedRows.map((row) => row.goalId)
  )
  const isReached = (goalId: string) =>
    attainmentByGoalId.get(goalId)?.reached ?? false
  const rows =
    tab === "archived"
      ? allRows.filter((row) => row.status === "Archived")
      : nonArchivedRows.filter(
          (row) => isReached(row.goalId) === (tab === "reached")
        )
  const counts = {
    toReach: nonArchivedRows.filter((row) => !isReached(row.goalId)).length,
    reached: nonArchivedRows.filter((row) => isReached(row.goalId)).length,
    archived: allRows.filter((row) => row.status === "Archived").length,
  }
  const overviewMetrics = useGoalsOverviewMetrics(
    rows.map((row) => row.goalId),
    insights.estimates
  )

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
              {(["toReach", "reached", "archived"] as const).map((value) => (
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
              metrics={overviewMetrics}
              potentialProgress={insights.potentialProgressByGoalId}
              onMove={handleMove}
              onView={setDetailGoalId}
              reorderEnabled={tab === "toReach"}
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
