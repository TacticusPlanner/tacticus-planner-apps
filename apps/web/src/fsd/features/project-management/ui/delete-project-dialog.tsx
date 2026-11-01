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
import { Spinner } from "@workspace/ui/components/spinner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
  projectName: string
}

/**
 * Hard-delete confirmation for a project. Goals survive the delete (any left in no other project move
 * to the Default project), so this mirrors `DeleteGoalDialog`'s destructive confirm without a
 * type-to-confirm gate.
 */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("goals.project.deleteTitle", { name: projectName })}
          </DialogTitle>
          <DialogDescription>
            {t("goals.project.deleteDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={pending}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("goals.project.cancel")}
          </Button>
          <Button disabled={pending} variant="destructive" onClick={onConfirm}>
            {pending ? <Spinner /> : null}
            {t("goals.project.deleteConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
