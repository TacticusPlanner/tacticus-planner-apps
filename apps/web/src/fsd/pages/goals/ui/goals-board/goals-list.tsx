import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { GoalProgressLegend } from "../shared/goal-progress-visuals"
import { SortableList } from "../shared/sortable-list"
import { GoalRowCells } from "./goal-table-row"
import {
  isInFlightStatus,
  isReachedRow,
  REACHED_ROW_CLASS,
  type GoalsListProps,
} from "./goal-row-utils"
import { GoalsMobileCards } from "./goals-mobile-cards"

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. The row itself opens nothing; its Edit action opens the Edit goal dialog, and the actions
 * and nested buttons stop activation from bubbling so they keep working independently.
 * `reorderEnabled` shows a drag handle on every desktop row directly (no separate mode); mobile
 * additionally needs `mobileReorderActive` (add-inline-goal-reprioritize). */
export function GoalsList(props: GoalsListProps) {
  const isMobile = useIsMobile()
  const { rows } = props

  if (rows.length === 0) {
    return null
  }

  return isMobile ? <GoalsMobileCards {...props} /> : <GoalsTable {...props} />
}

function GoalsTable({
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onEdit = () => undefined,
  onReorder,
  reorderEnabled = false,
  reorderPending = false,
  levelPotentialProgress,
  levelChargedXp,
  levelPoolXpAvailable,
  xpBookRarity,
  project,
  reachedByGoalId,
  cascadeContext,
}: GoalsListProps) {
  const { t } = useTranslation()
  const [openPopoverGoalId, setOpenPopoverGoalId] = useState<string | null>(
    null
  )
  const hasLegend = rows.some((row) => potentialProgress?.has(row.goalId))
  // The leading cell holds the drag handle and/or the priority number; it is not a data column.
  const hasLeadingCell =
    reorderEnabled ||
    rows.some(
      (row) => row.priority !== undefined && isInFlightStatus(row.status)
    )

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          {hasLeadingCell ? (
            <TableHead className="w-16">
              <span className="sr-only">{t("goals.columns.reorder")}</span>
            </TableHead>
          ) : null}
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.projects")}</TableHead>
          <TableHead>{t("goals.columns.goal")}</TableHead>
          <TableHead>
            <span className="flex items-center gap-2">
              {t("goals.columns.progress")}
              <GoalProgressLegend show={hasLegend} />
            </span>
          </TableHead>
          <TableHead>{t("goals.columns.remaining")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">{t("goals.columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SortableList
          disabled={reorderPending}
          getId={(row) => row.goalId}
          items={rows}
          onReorder={(orderedIds, movedId) => onReorder?.(orderedIds, movedId)}
          renderItem={(row, sortable) => {
            const reached = isReachedRow(row, reachedByGoalId)
            return (
              <TableRow
                className={cn(
                  "h-14 data-[dragging]:relative data-[dragging]:z-10 data-[dragging]:bg-card data-[dragging]:outline-2 data-[dragging]:-outline-offset-2 data-[dragging]:outline-ring",
                  reached && REACHED_ROW_CLASS
                )}
                data-dragging={sortable.isDragging || undefined}
                data-goal-id={row.goalId}
                data-reached={reached || undefined}
                data-testid="goal-row"
                key={row.goalId}
                ref={sortable.setNodeRef}
                style={sortable.style}
              >
                <GoalRowCells
                  actions={actions}
                  cascadeContext={cascadeContext}
                  dragHandle={sortable.dragHandle}
                  estimates={estimates}
                  hasLeadingCell={hasLeadingCell}
                  levelChargedXp={levelChargedXp}
                  levelPoolXpAvailable={levelPoolXpAvailable}
                  levelPotentialProgress={levelPotentialProgress}
                  metrics={metrics}
                  onEdit={onEdit}
                  popoverOpen={openPopoverGoalId === row.goalId}
                  potentialProgress={potentialProgress}
                  project={project}
                  reachedByGoalId={reachedByGoalId}
                  reorderEnabled={reorderEnabled}
                  row={row}
                  setOpenPopoverGoalId={setOpenPopoverGoalId}
                  xpBookRarity={xpBookRarity}
                />
              </TableRow>
            )
          }}
        />
      </TableBody>
    </Table>
  )
}
