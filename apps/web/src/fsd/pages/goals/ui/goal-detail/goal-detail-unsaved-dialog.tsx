import { useTranslation } from "react-i18next"

import { ConfirmationDialog } from "@/shared/ui"

export function GoalDetailUnsavedDialog({
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
      cancelLabel={t("goals.detail.unsavedChangesCancel")}
      confirmLabel={t("goals.detail.unsavedChangesConfirm")}
      description={t("goals.detail.unsavedChangesDescription")}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      title={t("goals.detail.unsavedChangesTitle")}
    />
  )
}
