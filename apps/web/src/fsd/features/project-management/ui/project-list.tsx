import { useTranslation } from "react-i18next"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"
import type { useProjectActions } from "../model/use-project-actions"

type Props = {
  projects: ProjectSummary[]
  actions: ReturnType<typeof useProjectActions>
  onEdit: (project: ProjectSummary) => void
}

/**
 * The Projects page's permanent, inline project list (project-management spec: "Projects lists all
 * projects inline") — every non-deleted project, active and archived, as its own row with per-row
 * lifecycle actions (Edit / Set active / Archive / Restore). Row actions never change which
 * project's goals the page's goal list shows — that's the separate, trailing `ProjectSelect` this
 * list is paired with (see `ProjectsPage`).
 */
export function ProjectList({ projects, actions, onEdit }: Props) {
  const { t } = useTranslation()

  return (
    <ul className="flex flex-col gap-2" data-testid="project-list">
      {projects.map((project) => {
        const archived = project.status === "Archived"
        const archiveDisabled =
          actions.pending || project.isDefault || project.isActivePlan

        return (
          <li
            className="flex items-center justify-between gap-2 rounded-2xl border p-3"
            data-testid={`project-list-row-${project.projectId}`}
            key={project.projectId}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t("goals.project.rowActionsMenu")}
                  data-testid={`project-row-actions-trigger-${project.projectId}`}
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
                  {t("goals.project.edit")}
                </DropdownMenuItem>
                {archived ? (
                  <DropdownMenuItem
                    data-testid={`project-row-restore-${project.projectId}`}
                    onSelect={() =>
                      void actions.save(project, {
                        ...project,
                        status: "Active",
                      })
                    }
                  >
                    {t("goals.project.restore")}
                  </DropdownMenuItem>
                ) : (
                  <>
                    {!project.isActivePlan ? (
                      <DropdownMenuItem
                        data-testid={`project-row-set-active-${project.projectId}`}
                        onSelect={() =>
                          void actions.activate(project.projectId)
                        }
                      >
                        {t("goals.project.setActive")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      data-testid={`project-row-archive-${project.projectId}`}
                      disabled={archiveDisabled}
                      onSelect={() =>
                        void actions.save(project, {
                          ...project,
                          status: "Archived",
                        })
                      }
                    >
                      {t("goals.project.archive")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )
      })}
    </ul>
  )
}
