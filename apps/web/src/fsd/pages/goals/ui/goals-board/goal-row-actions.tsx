import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderInput, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
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
import {
  ManageProjectsSheet,
  useProjectActions,
} from "@/features/project-management"

import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { useMoveGoalFromProject } from "../../model/projects/use-move-goal-from-project"
import type { GoalRow } from "../../model/shared/types"
import { DeleteGoalDialog } from ".//delete-goal-dialog"
import { MoveToProjectDialog } from ".//move-to-project-dialog"
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
 * and resume are primary row actions" — reachable in one click, not behind the "⋯" menu), project
 * removal/move when the row is viewed inside a project, and a destructive delete gated behind
 * `DeleteGoalDialog`. On desktop, project removal/move and delete render as their own icon buttons
 * (`rework-goal-project-move-action`), leaving the "⋯" menu for Archive/Unarchive only — rendered
 * only when one of those applies. On mobile, every non-primary action stays inside the "⋯" menu,
 * unchanged. Removal and deletion are deliberately unalike: removal/move is an ordinary item that
 * acts immediately on one project, delete is destructive, account-wide, and confirmed. Reaching a
 * goal's target is computed automatically (see `model/attainment/`), never a manual action here. */
export function GoalRowActions({
  row,
  actions,
  project,
  onOpenChange,
  reached = false,
  cascadeContext,
}: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const removal = useMoveGoalFromProject()
  const projectActions = useProjectActions()
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
  // Whether the goal has another membership besides the viewed project — decides whether the row
  // offers a plain, destination-free Remove, or Move to project's picker/create flow. An unresolved
  // plan (membership not loaded yet) defaults to the Move-to-project affordance, disabled, rather
  // than guessing which one it'll turn out to be.
  const hasOtherMembership = removalPlan?.kind === "remove"
  const destinationUnknown =
    removalPlan?.kind === "unavailable" &&
    removalPlan.reason === "destinationUnknown"

  const openMoveFlow = () => {
    if (!project) return
    const candidates = removal.otherProjects(project.projectId)
    if (candidates.length === 0) {
      setCreateOpen(true)
    } else {
      setPickerOpen(true)
    }
  }

  const projectAction = project ? (
    <Button
      aria-label={
        hasOtherMembership
          ? t("goals.project.removeFromProject")
          : t("goals.project.moveToProject")
      }
      data-testid={
        hasOtherMembership
          ? `goal-row-remove-from-project-${goalId}`
          : `goal-row-move-to-project-${goalId}`
      }
      disabled={pending || destinationUnknown}
      onClick={
        hasOtherMembership
          ? () => void removal.remove(row, project)
          : openMoveFlow
      }
      size="icon-sm"
      variant="ghost"
    >
      <FolderInput />
    </Button>
  ) : null

  const deleteAction = (
    <Button
      aria-label={t("goals.actions.delete")}
      data-testid={`goal-row-delete-${goalId}`}
      disabled={pending}
      onClick={() => setConfirmOpen(true)}
      size="icon-sm"
      variant="destructive"
    >
      <Trash2 />
    </Button>
  )

  const canArchiveOrUnarchive = row.status === "Archived" || reached
  const showMenu = isMobile || canArchiveOrUnarchive

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

      {!isMobile ? projectAction : null}
      {!isMobile ? deleteAction : null}

      {showMenu ? (
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
            {isMobile && project ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid={
                    hasOtherMembership
                      ? `goal-row-remove-from-project-${goalId}`
                      : `goal-row-move-to-project-${goalId}`
                  }
                  disabled={pending || destinationUnknown}
                  onSelect={
                    hasOtherMembership
                      ? () => void removal.remove(row, project)
                      : openMoveFlow
                  }
                >
                  {hasOtherMembership
                    ? t("goals.project.removeFromProject")
                    : t("goals.project.moveToProject")}
                </DropdownMenuItem>
              </>
            ) : null}
            {isMobile ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid={`goal-row-delete-${goalId}`}
                  variant="destructive"
                  onSelect={() => setConfirmOpen(true)}
                >
                  {t("goals.actions.delete")}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

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

      {project ? (
        <MoveToProjectDialog
          onCreateNew={() => {
            setPickerOpen(false)
            setCreateOpen(true)
          }}
          onOpenChange={setPickerOpen}
          onSelect={(destination) => {
            void removal
              .moveToExisting(row, project, destination)
              .then((ok) => {
                if (ok) setPickerOpen(false)
              })
          }}
          open={pickerOpen}
          pending={pending}
          projects={removal.otherProjects(project.projectId)}
        />
      ) : null}

      {project ? (
        <ManageProjectsSheet
          actions={projectActions}
          onCreated={(created) => {
            setCreateOpen(false)
            void removal.moveToExisting(row, project, created)
          }}
          onOpenChange={setCreateOpen}
          open={createOpen}
          project={undefined}
        />
      ) : null}
    </>
  )
}
