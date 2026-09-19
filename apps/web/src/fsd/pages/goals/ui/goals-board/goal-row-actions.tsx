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
import type { ProjectSummary } from "@/entities/project"

import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { useRemoveGoalFromProject } from "../../model/projects/use-remove-goal-from-project"
import type { GoalRow } from "../../model/shared/types"
import { DeleteGoalDialog } from ".//delete-goal-dialog"

type Props = {
  row: GoalRow
  actions: ReturnType<typeof useGoalActions>
  /** The project this row is being viewed inside, when there is one. Present on a project's detail
   *  route and absent on Overview, which is what decides whether project removal is offered. */
  project?: ProjectSummary
  /** Notified when this menu opens/closes — lets a list close an unrelated open info popover
   *  (`goal-progress-display`'s "closes on ... opening the row menu" requirement) rather than
   *  letting both float over the row at once. */
  onOpenChange?: (open: boolean) => void
}

/** Per-row "⋯" lifecycle menu — resume/pause, archive/unarchive, project removal when the row is
 * viewed inside a project, and a destructive delete gated behind `DeleteGoalDialog`. Removal and
 * deletion are deliberately unalike: removal is an ordinary item that acts immediately on one
 * project, delete is destructive, account-wide, and confirmed. Reaching a goal's target is computed
 * automatically (see `model/attainment/`), never a manual action here. */
export function GoalRowActions({ row, actions, project, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const removal = useRemoveGoalFromProject()
  const goalId = row.goalId
  const pending =
    actions.pendingId === goalId || removal.pendingGoalId === goalId

  const setStatus = (next: GoalStatus) => void actions.setStatus(goalId, next)
  const removalPlan = project ? removal.planFor(row, project.projectId) : null
  const removalUnavailable =
    removalPlan?.kind === "unavailable" ? removalPlan.reason : null

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
          {row.status === "Active" ? (
            <DropdownMenuItem onSelect={() => setStatus("Paused")}>
              {t("goals.actions.pause")}
            </DropdownMenuItem>
          ) : null}
          {row.status === "Paused" ? (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.resume")}
            </DropdownMenuItem>
          ) : null}
          {row.status !== "Archived" ? (
            <DropdownMenuItem onSelect={() => setStatus("Archived")}>
              {t("goals.actions.archive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.unarchive")}
            </DropdownMenuItem>
          )}
          {project ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid={`goal-row-remove-from-project-${goalId}`}
                disabled={removalUnavailable !== null}
                onSelect={() => void removal.remove(row, project)}
              >
                {t("goals.project.removeFromProject")}
              </DropdownMenuItem>
              {removalUnavailable ? (
                <p
                  className="max-w-64 px-2 py-1 text-xs text-muted-foreground"
                  data-testid={`goal-row-remove-unavailable-${goalId}`}
                >
                  {removalUnavailable === "lastMembershipIsDefault"
                    ? t("goals.project.removeLastMembership")
                    : t("goals.project.removeDestinationUnknown")}
                </p>
              ) : null}
            </>
          ) : null}
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
        projectName={project?.name}
      />
    </>
  )
}
