import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  AddGoalsToProjectSheet,
  ManageProjectsSheet,
  NewProjectFab,
  ProjectList,
  type ProjectCardSummary,
  orderDefaultFirst,
  useProjectActions,
  useProjectsWithGoals,
} from "@/features/project-management"
import type { ProjectSummary } from "@/entities/project"

import { useCreateGoalLauncher } from "@/features/goal-create"
import { useGoalAttainment } from "@/features/goal-planning"
import { useGoalsOverviewMetrics } from "@/features/goal-planning"
import { usePlanInsights } from "@/features/goal-planning"
import { useProjectsListTutorial } from "./projects-list-page.tutorial"

/**
 * The dedicated project-management surface (project-management spec: "The list route shows every
 * project without its goal table") - every project (including archived) as its own row with
 * inline lifecycle-action icons, a narrowed create/edit form Sheet opened via a row's Edit action
 * or the "New project" FAB, and the project-specific actions (Create goal, Manage goals) in each
 * row's menu. No goal table, filters, or project selector here - clicking a row opens the project on
 * the Goals page (`/plan/goals?project=`).
 */
export function ProjectsListPage() {
  const { t } = useTranslation()
  useProjectsListTutorial()
  const navigate = useNavigate()
  const projectsWithGoals = useProjectsWithGoals()
  const { projectsRead: projects, goalsRead } = projectsWithGoals
  const hasProjects = projects.projects.length > 0
  const [sheetOpen, setSheetOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [sheetProject, setSheetProject] = useState<ProjectSummary | undefined>(
    undefined
  )
  // The row whose Manage goals (bulk membership) sheet is open; one sheet for the whole page.
  const [manageGoalsProject, setManageGoalsProject] = useState<
    ProjectSummary | undefined
  >(undefined)
  const projectActions = useProjectActions()
  const launchCreateGoal = useCreateGoalLauncher()
  const createGoalIn = (project: ProjectSummary) =>
    launchCreateGoal({ projectIds: [project.projectId] })
  const defaultProject = projects.projects.find((project) => project.isDefault)
  const available = orderDefaultFirst(projects.projects)
  const archived = projects.projects.filter(
    (project) => project.status === "Archived"
  )
  // Counts come from the goals list joined by each project's `goalIds` (no per-project read); one
  // goals-list failure makes every summary unavailable with one retry.
  const summaryProjects = projectsWithGoals.projects.filter(
    (project) => project.status !== "Archived" || archivedOpen
  )
  const defaultGoalIds = (
    projectsWithGoals.projects.find((project) => project.isDefault)?.goals ?? []
  ).map((goal) => goal.goalId)
  const defaultAttainment = useGoalAttainment(defaultGoalIds)
  // The Default project's numbers are its goals' outcomes from the one global run, not a project-only plan.
  // An empty scope (no Default project, or its goals not loaded yet) skips the run's fan-out.
  const { result: defaultInsights } = usePlanInsights(
    defaultProject ? defaultGoalIds : []
  )
  const defaultMetrics = useGoalsOverviewMetrics(
    defaultGoalIds,
    defaultInsights.estimates
  )
  const summaries = new Map<string, ProjectCardSummary>()
  for (const project of summaryProjects) {
    if (goalsRead.loading) {
      summaries.set(project.projectId, { status: "loading" })
      continue
    }
    if (goalsRead.isError) {
      summaries.set(project.projectId, {
        status: "error",
        retry: goalsRead.retry,
      })
      continue
    }
    const members = project.goals
    const units = new Set(
      members
        .filter((goal) => goal.status === "Active" || goal.status === "Paused")
        .map((goal) => `${goal.entityType}:${goal.entityId}`)
    ).size
    summaries.set(project.projectId, {
      status: "success",
      units,
      goals: members.length,
      ...(project.isDefault
        ? {
            reached: members.filter(
              (goal) => defaultAttainment.get(goal.goalId)?.reached
            ).length,
            blocked: members.filter(
              (goal) => defaultMetrics.get(goal.goalId)?.blockers.isBlocked
            ).length,
            completionDate: defaultInsights.completionDate,
            unestimatedGoalCount: defaultInsights.unestimatedGoalCount,
          }
        : {}),
    })
  }

  const openNewProject = () => {
    setSheetProject(undefined)
    setSheetOpen(true)
  }
  const openEditProject = (project: ProjectSummary) => {
    setSheetProject(project)
    setSheetOpen(true)
  }
  const openProjectOnGoals = (project: ProjectSummary) => {
    void navigate(`/plan/goals?project=${project.projectId}`)
  }

  return (
    <div className="flex flex-col gap-6" data-testid="projects-page">
      {hasProjects ? (
        <div className="grid gap-8">
          {/* Static page copy, not a tooltip or a dismissible callout: the question it answers is
              asked on arrival, and a dismissed callout stops answering it for exactly the people who
              dismissed it too early. The empty dashboard carries its own wording instead, so this
              renders only when there is at least one project. */}
          <p
            className="text-sm text-muted-foreground"
            data-testid="projects-page-intro"
          >
            {t("goals.project.dashboardIntro")}
          </p>
          <ProjectList
            actions={projectActions}
            onCreateGoal={createGoalIn}
            onEdit={openEditProject}
            onManageGoals={setManageGoalsProject}
            onSelect={openProjectOnGoals}
            projects={available}
            summaries={summaries}
          />
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
                  onSelect={openProjectOnGoals}
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
      {manageGoalsProject ? (
        <AddGoalsToProjectSheet
          onCreateGoal={() => createGoalIn(manageGoalsProject)}
          onOpenChange={(open) => {
            if (!open) setManageGoalsProject(undefined)
          }}
          open
          project={manageGoalsProject}
        />
      ) : null}
    </div>
  )
}
