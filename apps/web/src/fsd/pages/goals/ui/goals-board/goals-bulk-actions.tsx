import { useTranslation } from "react-i18next"
import { FolderPlus, Pause, Play, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import type { CascadeTarget } from "../../model/goals-data/use-goal-actions"
import type { GoalRow } from "../../model/shared/types"
import { isReachedRow } from "./goal-row-utils"

type Props = {
  /** The selected rows, resolved by the page from its selection set. */
  selectedRows: readonly GoalRow[]
  reachedByGoalId?: ReadonlyMap<string, boolean>
  /** Goals with their own request in flight are skipped by every action. */
  pendingIds: ReadonlySet<string>
  onPause: (targets: CascadeTarget[]) => void
  onResume: (targets: CascadeTarget[]) => void
  onAddToProject: () => void
  onDelete: () => void
  /** Icon-only buttons (the mobile bottom bar); the label stays as the accessible name. */
  compact?: boolean
}

/** The four bulk actions over the page's selection (`goal-bulk-actions`), shared by the desktop
 *  actions row and the mobile bottom bar so the two cannot drift. Applicability is derived here from
 *  the selection at render time: Pause acts on selected Active non-reached goals, Resume on Paused
 *  ones, each skipping goals already in flight; Add to project and Delete take any selection. */
export function GoalsBulkActions({
  selectedRows,
  reachedByGoalId,
  pendingIds,
  onPause,
  onResume,
  onAddToProject,
  onDelete,
  compact = false,
}: Props) {
  const { t } = useTranslation()
  const actionable = selectedRows.filter((row) => !pendingIds.has(row.goalId))
  const targetsFor = (status: "Active" | "Paused"): CascadeTarget[] =>
    actionable
      .filter(
        (row) => row.status === status && !isReachedRow(row, reachedByGoalId)
      )
      .map((row) => ({ goalId: row.goalId, previousStatus: status }))
  const pauseTargets = targetsFor("Active")
  const resumeTargets = targetsFor("Paused")

  const buttons = [
    {
      key: "pause",
      count: pauseTargets.length,
      icon: <Pause />,
      onClick: () => onPause(pauseTargets),
    },
    {
      key: "resume",
      count: resumeTargets.length,
      icon: <Play />,
      onClick: () => onResume(resumeTargets),
    },
    {
      key: "addToProject",
      count: actionable.length,
      icon: <FolderPlus />,
      onClick: onAddToProject,
    },
    {
      key: "delete",
      count: actionable.length,
      icon: <Trash2 />,
      onClick: onDelete,
    },
  ] as const

  return (
    <div
      className="flex items-center gap-2"
      data-testid="goals-bulk-actions"
      role="group"
    >
      {buttons.map(({ key, count, icon, onClick }) => {
        const label =
          count > 0
            ? t(`goals.bulk.${key}Count`, { count })
            : t(`goals.bulk.${key}`)
        return (
          <Button
            aria-label={compact ? label : undefined}
            data-testid={`goals-bulk-${key}`}
            disabled={count === 0}
            key={key}
            onClick={onClick}
            size={compact ? "icon" : "sm"}
            variant="outline"
          >
            {icon}
            {compact ? null : label}
          </Button>
        )
      })}
    </div>
  )
}
