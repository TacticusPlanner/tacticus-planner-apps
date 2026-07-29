import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
}

/**
 * Single-goal hard-delete confirmation. A single-goal delete's blast radius is far smaller than the guild
 * purge's, so this skips `guild-purge-dialog.tsx`'s type-to-confirm-word gate but keeps its destructive
 * warning + pending-state shape.
 */
export function DeleteGoalDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: Props) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          onOpenChange(next)
        }
      }}
    >
      <DialogContent className="sm:max-w-md" data-testid="delete-goal-dialog">
        <DialogHeader>
          <DialogTitle>{t("goals.delete.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("goals.delete.description")}
        </p>
        <DialogFooter>
          <Button
            disabled={pending}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("goals.delete.cancel")}
          </Button>
          <Button
            data-testid="delete-goal-confirm"
            disabled={pending}
            variant="destructive"
            onClick={onConfirm}
          >
            {pending ? <Spinner /> : null}
            {t("goals.delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
