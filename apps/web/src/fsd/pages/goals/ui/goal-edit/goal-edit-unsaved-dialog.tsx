import { useTranslation } from "react-i18next"

import { ConfirmationDialog } from "@/shared/ui"

export function GoalEditUnsavedDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()

  return (
    <ConfirmationDialog
      cancelLabel={t("goals.edit.unsaved.keep")}
      confirmLabel={t("goals.edit.unsaved.discard")}
      description={t("goals.edit.unsaved.description")}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      title={t("goals.edit.unsaved.title")}
    />
  )
}
