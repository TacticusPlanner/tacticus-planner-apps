import type { ComponentProps, ReactNode } from "react"
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

export type ConfirmationDialogProps = {
  open: boolean
  /** The question: "Delete this project?" */
  title: ReactNode
  /** One sentence on what is lost. */
  description?: ReactNode
  /** Repeats the verb + object of the action: "Delete project". */
  confirmLabel: ReactNode
  cancelLabel: ReactNode
  confirmVariant?: ComponentProps<typeof Button>["variant"]
  /** Extra content between the description and the buttons: a choice, a type-to-confirm field, an
   *  error. */
  children?: ReactNode
  /** The action is running: both buttons are off, confirm shows a spinner and the dialog stays open. */
  pending?: boolean
  /** Confirm is off, e.g. until a type-to-confirm word matches. */
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  "data-testid"?: string
  confirmTestId?: string
}

/** The one confirm pattern (UI style guide, rule 8): a narrow centered dialog whose title asks the
 *  question, whose description says what is lost, and whose footer is Cancel then the confirm action.
 *  Escape and a click outside cancel, except while the action is pending. */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "destructive",
  children,
  pending = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  "data-testid": testId = "confirmation-dialog",
  confirmTestId = "confirmation-dialog-confirm",
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel()
      }}
    >
      {/* No close button: Cancel, Escape and a click outside already cancel. */}
      <DialogContent
        className="sm:max-w-md"
        data-testid={testId}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description === undefined ? null : (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button disabled={pending} onClick={onCancel} variant="outline">
            {cancelLabel}
          </Button>
          <Button
            data-testid={confirmTestId}
            disabled={pending || confirmDisabled}
            onClick={onConfirm}
            variant={confirmVariant}
          >
            {pending ? <Spinner /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
