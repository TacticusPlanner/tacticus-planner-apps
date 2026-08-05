import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  ManageProjectsSheet,
  ProjectList,
  reorderedMemberIds,
  useProjectActions,
} from "@/features/project-management"
import {
  ProjectSelect,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"
import { StatusFilterSelect, type GoalStatusFilterValue } from "@/entities/goal"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { goalRowFromProjectMember } from "../../model/shared/types"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { useProjectGoals } from "../../model/projects/use-project-goals"
import { GoalDetailSheet } from "../goal-detail/goal-detail-sheet"
import { GoalsList } from "../goals-board/goals-list"

// Mirrors goals-page.tsx's grouping (plan §3): "toReach"/"reached" come from computed attainment,
// never the goal's lifecycle `status`; "archived" stays status-driven.
type Tab = GoalStatusFilterValue

/**
 * The dedicated project-management surface (project-management spec): a permanent, inline project
 * list (including archived projects) with per-row lifecycle actions, a narrowed create/edit form
 * Sheet, and — separate from the list — a `ProjectSelect` that alone drives which project's goals
 * the list below shows. Row actions never change that selection.
 */
export function ProjectsPage() {
  const { t } = useTranslation()
  const projects = useProjects()
  const hasProjects = projects.projects.length > 0
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const projectId =
    selectedProjectId ??
    projects.activeProjectId ??
    projects.projects.find((project) => project.status !== "Archived")
      ?.projectId
  const [tab, setTab] = useState<Tab>("toReach")
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetProject, setSheetProject] = useState<ProjectSummary | undefined>(
    undefined
  )
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

  const openNewProject = () => {
    setSheetProject(undefined)
    setSheetOpen(true)
  }
  const openEditProject = (project: ProjectSummary) => {
    setSheetProject(project)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6" data-testid="projects-page">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {t("goals.project.listTitle")}
        </h2>
        <Button
          data-testid="projects-new-project"
          onClick={openNewProject}
          size="sm"
          variant="outline"
        >
          <Plus data-icon="inline-start" />
          {t("goals.project.newProject")}
        </Button>
      </div>

      {hasProjects ? (
        <>
          <ProjectList
            actions={projectActions}
            onEdit={openEditProject}
            projects={projects.projects}
          />

          {/* goals-navigation spec: the project selector is trailing, paired in the same row as the
              status filter, right after the project list — row actions above never change it. */}
          <div className="flex items-center justify-between gap-2">
            <StatusFilterSelect
              counts={counts}
              onValueChange={setTab}
              testId="projects-status-filter"
              value={tab}
            />
            <ProjectSelect
              onProjectIdChange={setSelectedProjectId}
              projectId={projectId}
              projects={projects.projects}
              testId="projects-goal-project-select"
            />
          </div>

          {!projectId ? (
            <Card data-testid="projects-page-no-selection">
              <CardHeader>
                <CardTitle>{t("goals.project.noSelectionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t("goals.project.noSelectionDescription")}
              </CardContent>
            </Card>
          ) : projectGoals.fetchState.status === "error" ? (
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
      ) : (
        <Card data-testid="projects-page-empty">
          <CardHeader>
            <CardTitle>{t("goals.project.noProjectTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("goals.project.noProjectDescription")}
          </CardContent>
        </Card>
      )}

      <ManageProjectsSheet
        actions={projectActions}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        project={sheetProject}
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
