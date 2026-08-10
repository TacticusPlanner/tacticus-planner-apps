import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  ManageProjectsSheet,
  NewProjectFab,
  ProjectList,
  type ProjectCardSummary,
  useProjectActions,
} from "@/features/project-management"
import {
  projectQueries,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"

import { useGoalAttainment } from "../../model/attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import { usePlanInsights } from "../../model/insights/use-plan-insights"
import { useProjectsListTutorial } from "./projects-list-page.tutorial"

/**
 * The dedicated project-management surface (project-management spec: "The list route shows every
 * project without its goal table") - every project (including archived) as its own row with
 * inline lifecycle-action icons, a narrowed create/edit form Sheet opened via a row's Edit action
 * or the "New project" FAB. No goal table, filters, or project selector here - those live on a
 * project's own detail route (`ProjectDetailPage`), reached by clicking a row.
 */
export function ProjectsListPage() {
  const { t } = useTranslation()
  useProjectsListTutorial()
  const navigate = useNavigate()
  const projects = useProjects()
  const hasProjects = projects.projects.length > 0
  const [sheetOpen, setSheetOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [sheetProject, setSheetProject] = useState<ProjectSummary | undefined>(
    undefined
  )
  const projectActions = useProjectActions()
  const current = projects.projects.find((project) => project.isActivePlan)
  const available = projects.projects.filter(
    (project) => !project.isActivePlan && project.status !== "Archived"
  )
  const archived = projects.projects.filter(
    (project) => project.status === "Archived"
  )
  const summaryProjects = projects.projects.filter(
    (project) => project.status !== "Archived" || archivedOpen
  )
  const summaryQueries = useQueries({
    queries: summaryProjects.map((project) =>
      projectQueries.goals(project.projectId)
    ),
  })
  const currentIndex = current
    ? summaryProjects.findIndex(
        (project) => project.projectId === current.projectId
      )
    : -1
  const currentGoals =
    currentIndex >= 0 ? (summaryQueries[currentIndex]?.data?.goals ?? []) : []
  const currentGoalIds = currentGoals.map((entry) => entry.goal.goalId)
  const currentAttainment = useGoalAttainment(currentGoalIds)
  const { result: currentInsights } = usePlanInsights(
    current?.projectId,
    currentGoals
  )
  const currentMetrics = useGoalsOverviewMetrics(
    currentGoalIds,
    currentInsights.estimates
  )
  const summaries = new Map<string, ProjectCardSummary>()
  summaryProjects.forEach((project, index) => {
    const query = summaryQueries[index]
    if (!query || query.isPending) {
      summaries.set(project.projectId, { status: "loading" })
      return
    }
    if (query.isError) {
      summaries.set(project.projectId, {
        status: "error",
        retry: () => void query.refetch(),
      })
      return
    }
    const members = query.data.goals
    const units = new Set(
      members
        .filter(
          (entry) =>
            entry.goal.status === "Active" || entry.goal.status === "Paused"
        )
        .map((entry) => `${entry.goal.entityType}:${entry.goal.entityId}`)
    ).size
    summaries.set(project.projectId, {
      status: "success",
      units,
      goals: members.length,
      ...(project.isActivePlan
        ? {
            reached: members.filter(
              (entry) => currentAttainment.get(entry.goal.goalId)?.reached
            ).length,
            blocked: members.filter(
              (entry) =>
                currentMetrics.get(entry.goal.goalId)?.blockers.isBlocked
            ).length,
            completionDate: currentInsights.completionDate,
          }
        : {}),
    })
  })

  const openNewProject = () => {
    setSheetProject(undefined)
    setSheetOpen(true)
  }
  const openEditProject = (project: ProjectSummary) => {
    setSheetProject(project)
    setSheetOpen(true)
  }
  const openProjectDetail = (project: ProjectSummary) => {
    void navigate(`/goals/projects/${project.projectId}`)
  }

  return (
    <div className="flex flex-col gap-6" data-testid="projects-page">
      {hasProjects ? (
        <div className="grid gap-8">
          {current ? (
            <section className="grid gap-3">
              <h2 className="text-lg font-semibold">
                {t("goals.project.currentPlan")}
              </h2>
              <ProjectList
                actions={projectActions}
                onEdit={openEditProject}
                onSelect={openProjectDetail}
                projects={[current]}
                summaries={summaries}
              />
            </section>
          ) : null}
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">
              {t("goals.project.otherProjects")}
            </h2>
            {available.length > 0 ? (
              <ProjectList
                actions={projectActions}
                onEdit={openEditProject}
                onSelect={openProjectDetail}
                projects={available}
                summaries={summaries}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("goals.project.noOtherProjects")}
              </p>
            )}
          </section>
          {archived.length > 0 ? (
            <details
              onToggle={(event) => setArchivedOpen(event.currentTarget.open)}
              open={archivedOpen}
            >
              <summary className="cursor-pointer text-lg font-semibold">
                {t("goals.project.archivedProjects", {
                  count: archived.length,
                })}
              </summary>
              <div className="mt-3">
                <ProjectList
                  actions={projectActions}
                  onEdit={openEditProject}
                  onSelect={openProjectDetail}
                  projects={archived}
                  summaries={summaries}
                />
              </div>
            </details>
          ) : null}
        </div>
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

      <NewProjectFab onClick={openNewProject} />
      <ManageProjectsSheet
        actions={projectActions}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        project={sheetProject}
      />
    </div>
  )
}
