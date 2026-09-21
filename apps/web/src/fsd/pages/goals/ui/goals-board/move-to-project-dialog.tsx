import { useTranslation } from "react-i18next"
import { FolderPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The account's other non-archived projects to move the goal into (`useMoveGoalFromProject`'s
   *  `otherProjects`) — Current plan included. Only opened when non-empty; the zero-projects case
   *  skips this dialog entirely and goes straight to project creation
   *  (`rework-goal-project-move-action`: "Move to project has a single action when there is nowhere
   *  existing to move to"). */
  projects: ProjectSummary[]
  pending: boolean
  onSelect: (project: ProjectSummary) => void
  onCreateNew: () => void
}

/** The goal row's "Move to project" destination picker — a `Dialog` (not a `Popover`) so it opens
 * identically from a desktop icon button's `onClick` and a mobile `DropdownMenuItem`'s `onSelect`,
 * mirroring `DeleteGoalDialog`'s existing pattern in this same directory. */
export function MoveToProjectDialog({
  open,
  onOpenChange,
  projects,
  pending,
  onSelect,
  onCreateNew,
}: Props) {
  const { t } = useTranslation()

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="move-to-project-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("goals.project.moveToProjectTitle")}</DialogTitle>
          <DialogDescription>
            {t("goals.project.moveToProjectDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          {projects.map((project) => (
            <Button
              className="justify-start gap-2"
              data-testid={`move-to-project-option-${project.projectId}`}
              disabled={pending}
              key={project.projectId}
              onClick={() => onSelect(project)}
              variant="ghost"
            >
              <ProjectColorDot color={project.color} />
              <span className="flex-1 text-left">{project.name}</span>
              {project.isActivePlan ? (
                <span className="text-xs text-primary">
                  {t("goals.project.currentPlan")}
                </span>
              ) : null}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button
            data-testid="move-to-project-create-new"
            disabled={pending}
            onClick={onCreateNew}
            variant="outline"
          >
            <FolderPlus />
            {t("goals.project.createNewProject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
