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

import type {
  GoalMenuMoves,
  GoalRow,
  useGoalActions,
} from "@/features/goal-planning"
import { DeleteGoalDialog } from ".//delete-goal-dialog"
import { MoveToPriorityDialog } from "./move-to-priority-dialog"
import { toggleGoalStatus, type CascadeContext } from "./goal-row-utils"
import {
  canRemoveFromProject,
  removalMovesRow,
  type ProjectRemoval,
} from "./project-removal-flow"

type MoveDirection = keyof GoalMenuMoves

const MOVE_LABEL_KEYS = {
  top: "goals.actions.moveToTop",
  up: "goals.actions.moveUp",
  down: "goals.actions.moveDown",
} as const satisfies Record<MoveDirection, string>

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
  /** Present while the Goals page is scoped to a project: adds "Remove from this project" (or "Move to
   *  project" when it is the goal's only one) and names the project in the delete confirmation. */
  projectRemoval?: ProjectRemoval
  /** The priority moves this row offers (`goalMenuMoves`). Absent offers none. */
  moves?: GoalMenuMoves
  /** Moves this goal onto the position `displacedGoalId` holds. */
  onMove?: (displacedGoalId: string) => void
}

/** A goal row's single "…" menu, on both platforms: Edit, the priority moves (Move to top / up / down,
 * each only where it has a target, then "Move to priority…", which asks for the number in a small
 * dialog), Pause or Resume, the scoped project's
 * removal (only while the page is scoped to a project), then a destructive Delete gated behind
 * `DeleteGoalDialog`. Removal is an ordinary item that acts at once; Delete is account-wide and confirmed. Reaching a goal's target is computed automatically (see
 * `model/attainment/`), never a manual action here. */
export function GoalRowActions({
  row,
  actions,
  onEdit,
  onOpenChange,
  reached = false,
  cascadeContext,
  projectRemoval,
  moves,
  onMove,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const goalId = row.goalId
  const pending = actions.pendingIds.has(goalId)

  const setStatus = (next: GoalStatus) => {
    if (next === "Active" || next === "Paused") {
      void toggleGoalStatus(actions, row, next, cascadeContext)
    } else {
      void actions.setStatus(goalId, next, row.status, [])
    }
  }

  const moveItems = onMove
    ? (
        [
          ["top", moves?.top],
          ["up", moves?.up],
          ["down", moves?.down],
        ] as const
      ).filter((item): item is readonly [MoveDirection, string] => !!item[1])
    : []

  const priorityOrder = onMove ? moves?.priorityOrder : undefined
  const hasMoves = moveItems.length > 0 || !!priorityOrder

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
          {hasMoves ? <DropdownMenuSeparator /> : null}
          {moveItems.map(([direction, displacedGoalId]) => (
            <DropdownMenuItem
              key={direction}
              onSelect={() => onMove?.(displacedGoalId)}
            >
              {t(MOVE_LABEL_KEYS[direction])}
            </DropdownMenuItem>
          ))}
          {priorityOrder ? (
            <DropdownMenuItem onSelect={() => setPriorityOpen(true)}>
              {t("goals.actions.moveToPriority")}
            </DropdownMenuItem>
          ) : null}
          {/* Delete brings its own separator; only split the moves from items between them. */}
          {hasMoves && (canToggle || projectRemoval) ? (
            <DropdownMenuSeparator />
          ) : null}
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
          {projectRemoval ? (
            <DropdownMenuItem
              className="whitespace-nowrap"
              data-testid={`goal-row-remove-from-project-${goalId}`}
              disabled={pending || !canRemoveFromProject(projectRemoval, row)}
              onSelect={() => projectRemoval.request([row])}
            >
              {removalMovesRow(projectRemoval, row)
                ? t("goals.project.moveToProject")
                : t("goals.project.removeFromProject")}
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

      {priorityOrder ? (
        <MoveToPriorityDialog
          goalId={goalId}
          onMove={(displacedGoalId) => onMove?.(displacedGoalId)}
          onOpenChange={setPriorityOpen}
          open={priorityOpen}
          priorityOrder={priorityOrder}
        />
      ) : null}

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
        projectName={projectRemoval?.project.name}
      />
    </>
  )
}
