import { useTranslation } from "react-i18next"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowUpDown,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { ProjectSelect, type ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "@/features/project-management"

/**
 * The detail route's own semantic header card: identity, lifecycle actions, the goal-count summary,
 * and the project switcher. Split out of `project-detail-page.tsx` only to keep that file under the
 * lint line cap (mirrors why `ProjectDetailGoals` was split out).
 */
export function ProjectDetailHeader({
  project,
  projectId,
  projects,
  onNavigateBack,
  onNavigateToProject,
  projectActions,
  isMobile,
  showMobileReorderToggle,
  mobileReorderActive,
  onToggleMobileReorder,
  onAddGoals,
  onEdit,
  unitCount,
  goalCount,
  accountGoalTotal,
  reachedCount,
  blockedCount,
  completionDate,
}: {
  project: ProjectSummary
  projectId: string
  projects: ProjectSummary[]
  onNavigateBack: () => void
  onNavigateToProject: (projectId: string) => void
  projectActions: ReturnType<typeof useProjectActions>
  isMobile: boolean
  showMobileReorderToggle: boolean
  mobileReorderActive: boolean
  onToggleMobileReorder: () => void
  onAddGoals: () => void
  onEdit: () => void
  unitCount: number
  goalCount: number
  accountGoalTotal: number | undefined
  reachedCount: number
  blockedCount: number
  completionDate: string | null | undefined
}) {
  const { t } = useTranslation()

  return (
    <Card data-testid="project-detail-header">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              aria-label={t("goals.project.backToProjects")}
              onClick={onNavigateBack}
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
                onClick={() => void projectActions.activate(project.projectId)}
                variant="outline"
              >
                {t("goals.project.makeCurrent")}
              </Button>
            ) : null}
            <Button
              data-testid="project-add-goals"
              onClick={onAddGoals}
              variant="outline"
            >
              {t("goals.project.addGoalsTrigger")}
            </Button>
            {isMobile && showMobileReorderToggle ? (
              <Button
                aria-pressed={mobileReorderActive}
                data-testid="project-mobile-reorder-toggle"
                onClick={onToggleMobileReorder}
                variant={mobileReorderActive ? "default" : "outline"}
              >
                <ArrowUpDown />
                {mobileReorderActive
                  ? t("goals.project.reorderDone")
                  : t("goals.project.reorderGoals")}
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
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil />
                  {t("goals.project.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="project-pause-all-goals"
                  disabled={projectActions.pending}
                  onSelect={() =>
                    void projectActions.setGoalsStatus(
                      project.projectId,
                      "Paused"
                    )
                  }
                >
                  <Pause />
                  {t("goals.project.pauseAllGoals")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="project-resume-all-goals"
                  disabled={projectActions.pending}
                  onSelect={() =>
                    void projectActions.setGoalsStatus(
                      project.projectId,
                      "Active"
                    )
                  }
                >
                  <Play />
                  {t("goals.project.resumeAllGoals")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        {/* Expressed against the account total so the project reads as a selection rather than as
            the whole goal list. While the total is pending or failed this falls back to the plain
            wording — never a guessed or zero total. */}
        <p
          className="text-sm text-muted-foreground"
          data-testid="project-detail-goal-summary"
        >
          {accountGoalTotal === undefined
            ? t("goals.project.unitGoalSummary", {
                units: unitCount,
                goals: goalCount,
              })
            : t("goals.project.unitGoalSummaryOfAccount", {
                units: unitCount,
                goals: goalCount,
                accountGoals: accountGoalTotal,
              })}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {t("goals.project.reachedSummary", { count: reachedCount })}
          </span>
          <span>
            {t("goals.project.blockedSummary", { count: blockedCount })}
          </span>
          {completionDate ? (
            <span>
              {t("goals.project.completionSummary", { date: completionDate })}
            </span>
          ) : null}
        </div>
        <ProjectSelect
          onProjectIdChange={(nextId) => {
            if (nextId) onNavigateToProject(nextId)
          }}
          projectId={projectId}
          projects={projects}
          testId="projects-goal-project-select"
        />
      </CardHeader>
    </Card>
  )
}
