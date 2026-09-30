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
import type { GoalRow } from "../../model/shared/types"
import { DeleteGoalDialog } from ".//delete-goal-dialog"
import { toggleGoalStatus, type CascadeContext } from "./goal-row-utils"

type Props = {
  row: GoalRow
  actions: ReturnType<typeof useGoalActions>
  /** Opens the Edit goal dialog for this goal. */
  onEdit: (goalId: string) => void
  /** Notified when this menu opens/closes — lets a list close an unrelated open info popover
   *  (`goal-progress-display`'s "closes on ... opening the row menu" requirement) rather than
   *  letting both float over the row at once. */
  onOpenChange?: (open: boolean) => void
  /** Whether this goal's target has been reached — hides pause/resume (`goal-status-actions`: "A
   *  Reached goal shows neither control"); the stored status is untouched. Absent renders as
   *  not-reached. */
  reached?: boolean
  /** Enables the menu's Pause/Resume prerequisite cascade. Absent pauses/resumes this goal alone. */
  cascadeContext?: CascadeContext
}

/** A goal row's single "…" menu, on both platforms: Edit, Pause or Resume, then a destructive Delete
 * gated behind `DeleteGoalDialog`. Reaching a goal's target is computed automatically (see
 * `model/attainment/`), never a manual action here. */
export function GoalRowActions({
  row,
  actions,
  onEdit,
  onOpenChange,
  reached = false,
  cascadeContext,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const goalId = row.goalId
  const pending = actions.pendingIds.has(goalId)

  const setStatus = (next: GoalStatus) => {
    if (next === "Active" || next === "Paused") {
      void toggleGoalStatus(actions, row, next, cascadeContext)
    } else {
      void actions.setStatus(goalId, next, row.status, [])
    }
  }

  const canToggle =
    !reached && (row.status === "Active" || row.status === "Paused")

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t("goals.actions.openMenu")}
            data-testid={`goal-row-actions-trigger-${goalId}`}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            data-testid={`goal-row-edit-${goalId}`}
            disabled={pending}
            onSelect={() => onEdit(goalId)}
          >
            {t("goals.actions.edit")}
          </DropdownMenuItem>
          {canToggle && row.status === "Active" ? (
            <DropdownMenuItem
              data-testid={`goal-row-pause-${goalId}`}
              disabled={pending}
              onSelect={() => setStatus("Paused")}
            >
              {t("goals.actions.pause")}
            </DropdownMenuItem>
          ) : null}
          {canToggle && row.status === "Paused" ? (
            <DropdownMenuItem
              data-testid={`goal-row-resume-${goalId}`}
              disabled={pending}
              onSelect={() => setStatus("Active")}
            >
              {t("goals.actions.resume")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`goal-row-delete-${goalId}`}
            disabled={pending}
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            {t("goals.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteGoalDialog
        count={1}
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
