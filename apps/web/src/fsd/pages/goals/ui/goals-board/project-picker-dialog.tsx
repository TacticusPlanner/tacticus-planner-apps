import { useTranslation } from "react-i18next"
import { FolderPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { ProjectColorDot } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

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

/** A destination project picker — a `ResponsiveDialog` (not a `Popover`) so it opens identically from a
 * toolbar button and the mobile bottom bar: a dialog on desktop, a bottom sheet on mobile. */
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
    <ResponsiveDialog
      data-testid="project-picker-dialog"
      width="narrow"
      onOpenChange={onOpenChange}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-1">
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
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          className="md:mr-auto"
          data-testid="project-picker-create-new"
          disabled={pending}
          onClick={onCreateNew}
          variant="ghost"
        >
          <FolderPlus />
          {t("goals.project.createNewProject")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
