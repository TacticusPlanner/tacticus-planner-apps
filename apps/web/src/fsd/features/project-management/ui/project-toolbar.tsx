import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { ProjectSelect, type ProjectSummary } from "@/entities/project"

import type { useProjectActions } from "../model/use-project-actions"
import { ManageProjectsSheet } from ".//manage-projects-sheet"

type Props = {
  projects: ProjectSummary[]
  projectId: string | undefined
  onProjectIdChange: (projectId: string | undefined) => void
  projectActions: ReturnType<typeof useProjectActions>
  requireProject?: boolean
}

/** Project filter select + (when a specific project is selected) its active-plan toggle and bulk
 * pause/resume actions. */
export function ProjectToolbar({
  projects,
  projectId,
  onProjectIdChange,
  projectActions,
  requireProject = false,
}: Props) {
  const { t } = useTranslation()
  const [manageOpen, setManageOpen] = useState(false)
  const selectedProject = projects.find(
    (project) => project.projectId === projectId
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProjectSelect
        allowAll={!requireProject}
        onProjectIdChange={onProjectIdChange}
        projectId={projectId}
        projects={projects}
        testId="goals-project-filter"
      />
      <Button
        data-testid="goals-project-manage"
        onClick={() => setManageOpen(true)}
        size="sm"
        variant="outline"
      >
        {t("goals.project.manage")}
      </Button>

      {selectedProject ? (
        <>
          {selectedProject.isActivePlan ? (
            <Badge variant="secondary">{t("goals.project.active")}</Badge>
          ) : (
            <Button
              data-testid="goals-project-set-active"
              disabled={projectActions.pending}
              onClick={() =>
                void projectActions.activate(selectedProject.projectId)
              }
              size="sm"
              variant="outline"
            >
              {t("goals.project.setActive")}
            </Button>
          )}
          <Button
            data-testid="goals-project-pause-all"
            disabled={projectActions.pending}
            onClick={() =>
              void projectActions.bulkStatus(
                selectedProject.projectId,
                "Paused"
              )
            }
            size="sm"
            variant="outline"
          >
            {t("goals.project.pauseAll")}
          </Button>
          <Button
            data-testid="goals-project-resume-all"
            disabled={projectActions.pending}
            onClick={() =>
              void projectActions.bulkStatus(
                selectedProject.projectId,
                "Active"
              )
            }
            size="sm"
            variant="outline"
          >
            {t("goals.project.resumeAll")}
          </Button>
        </>
      ) : null}
      <ManageProjectsSheet
        actions={projectActions}
        onOpenChange={setManageOpen}
        open={manageOpen}
        projects={projects}
      />
    </div>
  )
}
