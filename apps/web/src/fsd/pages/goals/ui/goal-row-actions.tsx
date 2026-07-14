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

import type { useGoalActions } from "../model/use-goal-actions"
import { DeleteGoalDialog } from "./delete-goal-dialog"

type Props = {
  goalId: string
  status: GoalStatus
  actions: ReturnType<typeof useGoalActions>
}

/** Per-row "⋯" lifecycle menu — resume/pause, complete, archive/unarchive, and a destructive delete
 * gated behind `DeleteGoalDialog`. */
export function GoalRowActions({ goalId, status, actions }: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pending = actions.pendingId === goalId

  const setStatus = (next: GoalStatus) => void actions.setStatus(goalId, next)

  return (
    <>
      <DropdownMenu>
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
          {status === "Paused" || status === "Draft" ? (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.resume")}
            </DropdownMenuItem>
          ) : null}
          {status !== "Completed" && status !== "Archived" ? (
            <DropdownMenuItem onSelect={() => setStatus("Completed")}>
              {t("goals.actions.complete")}
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
