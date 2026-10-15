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
  /** How many goals are being deleted (1 for a row's own menu); the copy pluralises on it. */
  count: number
  /** The project the goals are viewed in, when the page is scoped to one: the copy then names removal
   *  from it as the non-destructive alternative. */
  projectName?: string
}

/**
 * Hard-delete confirmation for one or several goals. A delete's blast radius is far smaller than the guild
 * purge's, so this skips `guild-purge-dialog.tsx`'s type-to-confirm-word gate but keeps its destructive
 * warning + pending-state shape.
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
          <DialogTitle>{t("goals.delete.title", { count })}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("goals.delete.description", { count })}
        </p>
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
            {t("goals.delete.confirm", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
