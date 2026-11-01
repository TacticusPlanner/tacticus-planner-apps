import { useState, type FormEvent } from "react"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { displacedForPriority } from "@/features/goal-planning"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string
  /** The complete in-flight order (`GoalMenuMoves.priorityOrder`); priority N is index N - 1. */
  priorityOrder: readonly string[]
  /** Moves the goal onto the position `displacedGoalId` holds, like the other menu moves. */
  onMove: (displacedGoalId: string) => void
}

/** Small "Move to priority" prompt opened from a goal's row menu: one number field, prefilled with
 *  the goal's current priority, that commits as a single move on Move. */
export function MoveToPriorityDialog({
  open,
  onOpenChange,
  goalId,
  priorityOrder,
  onMove,
}: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        {/* Remounted per opening so the field starts at the goal's current priority. */}
        {open ? (
          <MoveToPriorityForm
            goalId={goalId}
            onCancel={() => onOpenChange(false)}
            onMove={(displacedGoalId) => {
              onMove(displacedGoalId)
              onOpenChange(false)
            }}
            priorityOrder={priorityOrder}
          />
        ) : null}
        <DialogDescription className="sr-only">
          {t("goals.actions.moveToPriorityDescription", {
            total: priorityOrder.length,
          })}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

function MoveToPriorityForm({
  goalId,
  priorityOrder,
  onMove,
  onCancel,
}: Omit<Props, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const { t } = useTranslation()
  const total = priorityOrder.length
  const [value, setValue] = useState(() =>
    String(priorityOrder.indexOf(goalId) + 1)
  )
  const displaced = displacedForPriority(priorityOrder, goalId, Number(value))
  const fieldId = `move-to-priority-${goalId}`

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (displaced) onMove(displaced)
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{t("goals.actions.moveToPriorityTitle")}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>
          {t("goals.actions.moveToPriorityLabel", { total })}
        </Label>
        <Input
          id={fieldId}
          inputMode="numeric"
          max={total}
          min={1}
          onChange={(event) => setValue(event.target.value)}
          onFocus={(event) => event.target.select()}
          step={1}
          type="number"
          value={value}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("goals.actions.moveToPriorityCancel")}
        </Button>
        <Button disabled={!displaced} type="submit">
          {t("goals.actions.moveToPriorityConfirm")}
        </Button>
      </DialogFooter>
    </form>
  )
}
