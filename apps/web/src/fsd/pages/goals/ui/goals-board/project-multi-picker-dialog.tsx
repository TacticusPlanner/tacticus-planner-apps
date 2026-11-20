import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { ProjectColorDot } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

type Props = {
  onOpenChange: (open: boolean) => void
  /** The account's non-archived projects — the Default project included. */
  projects: readonly ProjectSummary[]
  onConfirm: (projects: ProjectSummary[]) => void
  onCreateNew: () => void
}

/**
 * Bulk Add to project's destination picker (add-goal-to-several-projects): check one or more
 * projects, then Add. A centered dialog at or above 768px and a bottom sheet below it. Mount it only
 * while open, so every opening starts with nothing checked.
 */
export function ProjectMultiPickerDialog({
  onOpenChange,
  projects,
  onConfirm,
  onCreateNew,
}: Props) {
  const { t } = useTranslation()
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set())
  const chosen = projects.filter((project) => checked.has(project.projectId))
  const toggle = (projectId: string, on: boolean) =>
    setChecked((current) => {
      const next = new Set(current)
      if (on) next.add(projectId)
      else next.delete(projectId)
      return next
    })

  return (
    <ResponsiveDialog
      data-testid="project-picker-dialog"
      desktopClassName="sm:max-w-md"
      onOpenChange={onOpenChange}
      open
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("goals.project.addToProjectTitle")}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("goals.project.addToProjectsDescription")}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <ul className="grid gap-1 pb-3">
          {projects.map((project) => (
            <li key={project.projectId}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted md:min-h-8">
                <Checkbox
                  checked={checked.has(project.projectId)}
                  data-testid={`project-picker-option-${project.projectId}`}
                  onCheckedChange={(value) =>
                    toggle(project.projectId, value === true)
                  }
                />
                <ProjectColorDot color={project.color} />
                <span className="flex-1 text-sm">{project.name}</span>
                {project.isDefault ? (
                  <span className="text-xs text-muted-foreground">
                    {t("goals.create.projectDefaultMarker")}
                  </span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          className="md:mr-auto"
          data-testid="project-picker-create-new"
          onClick={onCreateNew}
          variant="ghost"
        >
          <FolderPlus />
          {t("goals.project.createNewProject")}
        </Button>
        <Button
          data-testid="project-picker-confirm"
          disabled={chosen.length === 0}
          onClick={() => onConfirm(chosen)}
        >
          {chosen.length > 1
            ? t("goals.project.addToProjectsConfirmCount", {
                count: chosen.length,
              })
            : t("goals.project.addToProjectsConfirm")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
