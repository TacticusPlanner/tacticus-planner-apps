import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import type { GoalKind } from "@/entities/goal"
import { useProjects } from "@/entities/project"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { addedProjectNames } from "../../model/projects/added-project-names"
import { useGoalEditSave } from "../../model/goal-edit/use-goal-edit-save"
import { GoalProjectsField } from "./goal-projects-field"

/**
 * "Add to another project…" from a goal row menu (add-goal-to-several-projects): the Edit goal
 * dialog's membership picker on its own, a centered dialog at or above 768px and a sheet below.
 * Saving sends only `projectIds`, so the goal's status, target and priority stay as they are. Mount
 * it only while open: it reads the project list and seeds its draft from `projectIds` on mount.
 */
export function AddToAnotherProjectDialog({
  goal,
  projectIds,
  onOpenChange,
}: {
  goal: {
    goalId: string
    entityType: string
    entityId: string
    goalType: GoalKind
  }
  /** The goal's current projects. */
  projectIds: readonly string[]
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { projects } = useProjects()
  const unitName = useUnitName()
  const [selected, setSelected] = useState<string[]>(() => [...projectIds])
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const saver = useGoalEditSave({
    goalId: goal.goalId,
    onSaved: () => {
      const added = addedProjectNames(projectIds, selected, projects)
      toast.success(
        added.length > 0
          ? t("goals.project.addedToProjects", {
              projects: new Intl.ListFormat(i18n.language, {
                type: "conjunction",
              }).format(added),
            })
          : t("goals.project.projectsSaved")
      )
      onOpenChange(false)
    },
  })
  const changed =
    selected.length !== projectIds.length ||
    selected.some((projectId) => !projectIds.includes(projectId))
  const canSave = changed && selected.length > 0 && !saver.isSaving

  return (
    <ResponsiveDialog
      contentRef={setPortalContainer}
      data-testid="add-to-another-project-dialog"
      desktopClassName="sm:max-w-md"
      onOpenChange={onOpenChange}
      open
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("goals.project.addToAnotherTitle")}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {unitName(goal.entityType, goal.entityId)}
          {" · "}
          {t(`goals.create.goalTypes.${goal.goalType}`)}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="pb-3">
        <GoalProjectsField
          onSelectionChange={setSelected}
          portalContainer={portalContainer}
          projects={projects}
          projectsValid={selected.length > 0}
          selectedProjectIds={selected}
          testIdPrefix="add-to-another"
        />
        {saver.error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {(saver.error.kind === "invalid" || saver.error.kind === "failed"
              ? saver.error.message
              : null) ?? t("goals.project.projectsSaveFailed")}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("goals.edit.cancel")}
        </Button>
        <Button
          data-testid="add-to-another-save"
          disabled={!canSave}
          onClick={() => void saver.save({ projectIds: selected })}
        >
          {saver.isSaving ? <Spinner /> : null}
          {t("goals.edit.save")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
