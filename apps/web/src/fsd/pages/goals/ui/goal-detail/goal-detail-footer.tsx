import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { SheetFooter } from "@workspace/ui/components/sheet"

export function GoalDetailFooter({
  mode,
  onCancel,
  onEdit,
  onSave,
  saveDisabled,
}: {
  mode: "view" | "edit"
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
  saveDisabled: boolean
}) {
  const { t } = useTranslation()

  return (
    <SheetFooter>
      {mode === "view" ? (
        <Button data-testid="goal-detail-edit" onClick={onEdit}>
          {t("goals.detail.edit")}
        </Button>
      ) : (
        <>
          <Button
            data-testid="goal-detail-cancel"
            onClick={onCancel}
            variant="outline"
          >
            {t("goals.detail.cancel")}
          </Button>
          <Button
            data-testid="goal-detail-save"
            disabled={saveDisabled}
            onClick={onSave}
          >
            {t("goals.detail.save")}
          </Button>
        </>
      )}
    </SheetFooter>
  )
}
