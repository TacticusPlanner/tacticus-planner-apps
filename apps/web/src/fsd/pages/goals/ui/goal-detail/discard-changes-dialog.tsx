import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

type Props = {
  open: boolean
  onKeepEditing: () => void
  onDiscard: () => void
}

/** Confirms discarding unsaved edit-mode changes (plan §5) before the goal detail sheet closes or
 * switches back to view mode. Mirrors `delete-goal-dialog.tsx`'s shape. */
export function DiscardChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: Props) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onKeepEditing()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="discard-changes-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("goals.detail.unsavedChangesTitle")}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t("goals.detail.unsavedChangesDescription")}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onKeepEditing}>
            {t("goals.detail.unsavedChangesCancel")}
          </Button>
          <Button
            data-testid="discard-changes-confirm"
            variant="destructive"
            onClick={onDiscard}
          >
            {t("goals.detail.unsavedChangesConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
