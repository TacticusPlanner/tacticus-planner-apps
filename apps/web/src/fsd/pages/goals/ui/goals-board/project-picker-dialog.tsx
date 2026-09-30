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
  title: string
  description: string
  /** The account's non-archived projects to choose from — the Default project included. Only opened
   *  when non-empty; with none the caller goes straight to project creation. */
  projects: ProjectSummary[]
  pending: boolean
  onSelect: (project: ProjectSummary) => void
  onCreateNew: () => void
}

/** A destination project picker — a `Dialog` (not a `Popover`) so it opens identically from a toolbar
 * button and the mobile bottom bar, mirroring `DeleteGoalDialog`'s pattern in this directory. */
export function ProjectPickerDialog({
  open,
  onOpenChange,
  title,
  description,
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
        data-testid="project-picker-dialog"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          {projects.map((project) => (
            <Button
              className="justify-start gap-2"
              data-testid={`project-picker-option-${project.projectId}`}
              disabled={pending}
              key={project.projectId}
              onClick={() => onSelect(project)}
              variant="ghost"
            >
              <ProjectColorDot color={project.color} />
              <span className="flex-1 text-left">{project.name}</span>
              {project.isDefault ? (
                <span className="text-xs text-muted-foreground">
                  {t("goals.create.projectDefaultMarker")}
                </span>
              ) : null}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button
            data-testid="project-picker-create-new"
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
