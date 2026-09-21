import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MoreHorizontal, Pause, Play } from "lucide-react"
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
import { cascadeTargets, type CascadeContext } from "./goal-row-utils"

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
  /** Whether this goal's target has been reached — gates the "⋯" menu's Archive item. Absent (e.g. a
   *  caller that hasn't computed attainment) renders as not-reached, so Archive stays hidden. */
  reached?: boolean
  /** Enables the primary pause/resume control's prerequisite cascade. Absent disables it entirely
   *  (the primary control still pauses/resumes this goal alone). */
  cascadeContext?: CascadeContext
}

/** A goal row's status controls: a primary pause/resume icon button (`goal-status-actions`: "Pause
 * and resume are primary row actions" — reachable in one click, not behind the "⋯" menu), and the
 * "⋯" menu for everything else — archive/unarchive (Archive only once `reached`), project removal
 * when the row is viewed inside a project, and a destructive delete gated behind `DeleteGoalDialog`.
 * Removal and deletion are deliberately unalike: removal is an ordinary item that acts immediately on
 * one project, delete is destructive, account-wide, and confirmed. Reaching a goal's target is
 * computed automatically (see `model/attainment/`), never a manual action here. */
export function GoalRowActions({
  row,
  actions,
  project,
  onOpenChange,
  reached = false,
  cascadeContext,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const removal = useRemoveGoalFromProject()
  const goalId = row.goalId
  const pending =
    actions.pendingIds.has(goalId) || removal.pendingGoalId === goalId

  const setStatus = (next: GoalStatus) => {
    const cascade =
      next === "Active" || next === "Paused"
        ? cascadeTargets(row.dependsOn, next, cascadeContext).map((id) => ({
            goalId: id,
            // cascadeTargets only ever returns an id whose status cascadeContext already knows (it
            // filters out anything else) — the fallback here is unreachable, not a real guess.
            previousStatus: cascadeContext?.statusById.get(id) ?? next,
          }))
        : []
    void actions.setStatus(goalId, next, row.status, cascade)
  }
  const removalPlan = project ? removal.planFor(row, project.projectId) : null
  const removalUnavailable =
    removalPlan?.kind === "unavailable" ? removalPlan.reason : null

  return (
    <>
      {row.status === "Active" ? (
        <Button
          aria-label={t("goals.actions.pause")}
          data-testid={`goal-row-pause-${goalId}`}
          disabled={pending}
          onClick={() => setStatus("Paused")}
          size="icon-sm"
          variant="ghost"
        >
          <Pause />
        </Button>
      ) : null}
      {row.status === "Paused" ? (
        <Button
          aria-label={t("goals.actions.resume")}
          data-testid={`goal-row-resume-${goalId}`}
          disabled={pending}
          onClick={() => setStatus("Active")}
          size="icon-sm"
          variant="ghost"
        >
          <Play />
        </Button>
      ) : null}
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
          {row.status === "Archived" ? (
            <DropdownMenuItem onSelect={() => setStatus("Active")}>
              {t("goals.actions.unarchive")}
            </DropdownMenuItem>
          ) : reached ? (
            <DropdownMenuItem onSelect={() => setStatus("Archived")}>
              {t("goals.actions.archive")}
            </DropdownMenuItem>
          ) : null}
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
