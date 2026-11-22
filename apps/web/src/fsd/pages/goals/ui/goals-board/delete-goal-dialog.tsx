import { useTranslation } from "react-i18next"

import { ConfirmationDialog } from "@/shared/ui"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
  /** How many goals are being deleted (1 for a row's own menu); the copy pluralises on it. */
  count: number
  /** The project the goals are viewed in, when the page is scoped to one: the copy then names removal
   *  from it as the non-destructive alternative. */
  projectName?: string
}

/**
 * Hard-delete confirmation for one or several goals. A delete's blast radius is far smaller than the guild
 * purge's, so this skips `guild-purge-dialog.tsx`'s type-to-confirm-word gate.
 */
export function DeleteGoalDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
  count,
  projectName,
}: Props) {
  const { t } = useTranslation()

  return (
    <ConfirmationDialog
      cancelLabel={t("goals.delete.cancel")}
      confirmLabel={t("goals.delete.confirm", { count })}
      confirmTestId="delete-goal-confirm"
      data-testid="delete-goal-dialog"
      description={t("goals.delete.description", { count })}
      onCancel={() => onOpenChange(false)}
      onConfirm={onConfirm}
      open={open}
      pending={pending}
      title={t("goals.delete.title", { count })}
    >
      {projectName ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="delete-goal-project-alternative"
        >
          {t("goals.delete.projectAlternative", {
            count,
            project: projectName,
          })}
        </p>
      ) : null}
    </ConfirmationDialog>
  )
}
