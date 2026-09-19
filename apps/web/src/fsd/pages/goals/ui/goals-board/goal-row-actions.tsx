import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import type { GoalStatus } from "@/entities/goal"

import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { DeleteGoalDialog } from ".//delete-goal-dialog"

type Props = {
  goalId: string
  status: GoalStatus
  actions: ReturnType<typeof useGoalActions>
  /** Notified when this menu opens/closes — lets a list close an unrelated open info popover
   *  (`goal-progress-display`'s "closes on ... opening the row menu" requirement) rather than
   *  letting both float over the row at once. */
  onOpenChange?: (open: boolean) => void
}

/** Per-row "⋯" lifecycle menu — resume/pause, archive/unarchive, and a destructive delete gated
 * behind `DeleteGoalDialog`. Reaching a goal's target is computed automatically (see
 * `model/attainment/`), never a manual action here. */
export function GoalRowActions({
  goalId,
  status,
  actions,
  onOpenChange,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pending = actions.pendingId === goalId

  const setStatus = (next: GoalStatus) => void actions.setStatus(goalId, next)

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t("goals.actions.openMenu")}
            data-testid={`goal-row-actions-trigger-${goalId}`}
            disabled={pending}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "Active" ? (
            <DropdownMenuItem onSelect={() => setStatus("Paused")}>
              {t("goals.actions.pause")}
            </DropdownMenuItem>
          ) : null}
          {status === "Paused" ? (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.resume")}
            </DropdownMenuItem>
          ) : null}
          {status !== "Archived" ? (
            <DropdownMenuItem onSelect={() => setStatus("Archived")}>
              {t("goals.actions.archive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.unarchive")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`goal-row-delete-${goalId}`}
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            {t("goals.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteGoalDialog
        onConfirm={() =>
          void actions.remove(goalId).then((ok) => {
            if (ok) {
              setConfirmOpen(false)
            }
          })
        }
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        pending={pending}
      />
    </>
  )
}
