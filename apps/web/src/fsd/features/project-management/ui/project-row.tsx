import { useTranslation } from "react-i18next"
import { Archive, ArchiveRestore, Pencil, Star } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"

type Props = {
  project: ProjectSummary
  actions: ReturnType<typeof useProjectActions>
  onEdit: (project: ProjectSummary) => void
  /** Present only where clicking the row itself should navigate (the list route's rows) - the
   *  detail route's single current-project row has nothing to navigate to, so it omits this and
   *  the row isn't clickable there. */
  onSelect?: () => void
}

/** A project's row: color dot, name, status marker, and its lifecycle actions as inline icon
 *  buttons (project-management spec: "Project lifecycle actions render as inline icons on each
 *  row", not behind an overflow menu) - shared by the list route (one row per project) and the
 *  detail route (exactly one row, for the current project), so both present identical actions by
 *  construction rather than by keeping two implementations in sync. */
export function ProjectRow({ project, actions, onEdit, onSelect }: Props) {
  const { t } = useTranslation()
  const archived = project.status === "Archived"
  const archiveDisabled =
    actions.pending || project.isDefault || project.isActivePlan

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-2 rounded-2xl border p-3",
        onSelect ? "cursor-pointer" : undefined
      )}
      data-testid={`project-row-${project.projectId}`}
      onClick={onSelect}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ProjectColorDot color={project.color} />
        <span className="truncate font-medium">{project.name}</span>
        {archived ? (
          <Badge variant="secondary">{t("goals.status.Archived")}</Badge>
        ) : project.isActivePlan ? (
          <Badge variant="secondary">{t("goals.project.active")}</Badge>
        ) : null}
      </div>

      {/* Each icon stops its own click from bubbling to the row's onClick above, mirroring
          goals-list.tsx's stopRowNavigation pattern - so acting on a row never also navigates. */}
      <div className="flex items-center gap-1">
        <Button
          aria-label={t("goals.project.edit")}
          data-testid={`project-row-edit-${project.projectId}`}
          onClick={(event) => {
            event.stopPropagation()
            onEdit(project)
          }}
          size="icon-sm"
          title={t("goals.project.edit")}
          variant="ghost"
        >
          <Pencil />
        </Button>
        {archived ? (
          <Button
            aria-label={t("goals.project.restore")}
            data-testid={`project-row-restore-${project.projectId}`}
            disabled={actions.pending}
            onClick={(event) => {
              event.stopPropagation()
              void actions.save(project, { ...project, status: "Active" })
            }}
            size="icon-sm"
            title={t("goals.project.restore")}
            variant="ghost"
          >
            <ArchiveRestore />
          </Button>
        ) : (
          <>
            {!project.isActivePlan ? (
              <Button
                aria-label={t("goals.project.setActive")}
                data-testid={`project-row-set-active-${project.projectId}`}
                disabled={actions.pending}
                onClick={(event) => {
                  event.stopPropagation()
                  void actions.activate(project.projectId)
                }}
                size="icon-sm"
                title={t("goals.project.setActive")}
                variant="ghost"
              >
                <Star />
              </Button>
            ) : null}
            <Button
              aria-label={t("goals.project.archive")}
              data-testid={`project-row-archive-${project.projectId}`}
              disabled={archiveDisabled}
              onClick={(event) => {
                event.stopPropagation()
                void actions.save(project, { ...project, status: "Archived" })
              }}
              size="icon-sm"
              title={t("goals.project.archive")}
              variant="ghost"
            >
              <Archive />
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
