import { useTranslation } from "react-i18next"
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Star,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ProjectColorDot, type ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"

type Props = {
  project: ProjectSummary
  actions: ReturnType<typeof useProjectActions>
  onEdit: (project: ProjectSummary) => void
  /** Present where clicking the card should navigate to project detail. */
  onSelect?: () => void
  summary?: ProjectCardSummary
}

export type ProjectCardSummary =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "success"
      units: number
      goals: number
      reached?: number
      blocked?: number
      completionDate?: string | null
    }

/** A project's row: color dot, name, progress summary, and lifecycle actions. */
export function ProjectRow({
  project,
  actions,
  onEdit,
  onSelect,
  summary,
}: Props) {
  const { t } = useTranslation()
  const archived = project.status === "Archived"
  const archiveDisabled =
    actions.pending || project.isDefault || project.isActivePlan
  const projectContent = (
    <>
      <ProjectColorDot color={project.color} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{project.name}</span>
          {archived ? (
            <Badge variant="secondary">{t("goals.status.Archived")}</Badge>
          ) : project.isActivePlan ? (
            <Badge variant="secondary">{t("goals.project.currentPlan")}</Badge>
          ) : null}
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        ) : null}
        {summary?.status === "loading" ? (
          <Skeleton className="mt-2 h-4 w-36" />
        ) : summary?.status === "success" ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{t("goals.project.unitGoalSummary", summary)}</span>
            {summary.reached !== undefined ? (
              <span>
                {t("goals.project.reachedSummary", {
                  count: summary.reached,
                })}
              </span>
            ) : null}
            {summary.blocked !== undefined ? (
              <span>
                {t("goals.project.blockedSummary", {
                  count: summary.blocked,
                })}
              </span>
            ) : null}
            {summary.completionDate ? (
              <span>
                {t("goals.project.completionSummary", {
                  date: summary.completionDate,
                })}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )

  return (
    <li
      className="flex items-center justify-between gap-2 rounded-2xl border p-3"
      data-testid={`project-row-${project.projectId}`}
    >
      <div className="min-w-0 flex-1">
        {onSelect ? (
          <button
            className="flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={onSelect}
            type="button"
          >
            {projectContent}
          </button>
        ) : (
          <div className="flex min-w-0 items-start gap-3">{projectContent}</div>
        )}
        {summary?.status === "error" ? (
          <button
            className="mt-2 ml-7 text-sm text-destructive underline"
            onClick={summary.retry}
            type="button"
          >
            {t("goals.project.summaryUnavailable")}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        {!archived && !project.isActivePlan ? (
          <Button
            aria-label={t("goals.project.makeCurrent")}
            data-testid={`project-row-set-active-${project.projectId}`}
            disabled={actions.pending}
            onClick={() => void actions.activate(project.projectId)}
            size="sm"
            title={t("goals.project.makeCurrent")}
            variant="ghost"
          >
            <Star />
            {t("goals.project.makeCurrent")}
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("goals.project.moreActions")}
              data-testid={`project-row-actions-${project.projectId}`}
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              data-testid={`project-row-edit-${project.projectId}`}
              onSelect={() => onEdit(project)}
            >
              <Pencil />
              {t("goals.project.edit")}
            </DropdownMenuItem>
            {archived ? (
              <DropdownMenuItem
                data-testid={`project-row-restore-${project.projectId}`}
                disabled={actions.pending}
                onSelect={() =>
                  void actions.save(project, { ...project, status: "Active" })
                }
              >
                <ArchiveRestore />
                {t("goals.project.restore")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                data-testid={`project-row-archive-${project.projectId}`}
                disabled={archiveDisabled}
                onSelect={() =>
                  void actions.save(project, { ...project, status: "Archived" })
                }
                title={
                  archiveDisabled
                    ? t("goals.project.archiveUnavailable")
                    : undefined
                }
                variant="destructive"
              >
                <Archive />
                {archiveDisabled
                  ? t("goals.project.archiveUnavailable")
                  : t("goals.project.archive")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}
