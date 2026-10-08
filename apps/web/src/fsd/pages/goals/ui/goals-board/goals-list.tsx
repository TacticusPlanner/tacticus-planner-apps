import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { SortableList } from "@/shared/ui"
import { GoalRowCells } from "./goal-table-row"
import {
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

const EMPTY_SELECTION: ReadonlySet<string> = new Set()

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
  reachedByGoalId,
  cascadeContext,
  selection = EMPTY_SELECTION,
  onToggleSelected,
  visibleIds,
  onSelectAllVisible,
}: GoalsListProps) {
  const { t } = useTranslation()
  const [openPopoverGoalId, setOpenPopoverGoalId] = useState<string | null>(
    null
  )
  // Select-all covers every visible row (across groups), not just this table's rows.
  const scopeIds = visibleIds ?? rows.map((row) => row.goalId)
  const selectedCount = scopeIds.filter((id) => selection.has(id)).length
  const allSelected = scopeIds.length > 0 && selectedCount === scopeIds.length

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">
            <div className="flex items-center gap-2">
              <Checkbox
                aria-label={t("goals.bulk.selectAll")}
                checked={
                  allSelected
                    ? true
                    : selectedCount > 0
                      ? "indeterminate"
                      : false
                }
                data-testid="goals-select-all"
                onCheckedChange={() => onSelectAllVisible?.()}
              />
              <span className="sr-only">{t("goals.columns.reorder")}</span>
            </div>
          </TableHead>
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.projects")}</TableHead>
          <TableHead>{t("goals.columns.goal")}</TableHead>
          <TableHead>{t("goals.columns.progress")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead>{t("goals.columns.remaining")}</TableHead>
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
                  levelChargedXp={levelChargedXp}
                  levelPoolXpAvailable={levelPoolXpAvailable}
                  levelPotentialProgress={levelPotentialProgress}
                  metrics={metrics}
                  onEdit={onEdit}
                  popoverOpen={openPopoverGoalId === row.goalId}
                  potentialProgress={potentialProgress}
                  onToggleSelected={onToggleSelected}
                  selected={selection.has(row.goalId)}
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
