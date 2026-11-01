import { Fragment, useState } from "react"
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

import { useGoalCatalog } from "@/features/goal-planning"
import { SortableList } from "@/shared/ui"
import { GoalRowCells } from "./goal-table-row"
import {
  isReachedRow,
  REACHED_ROW_CLASS,
  type GoalsListProps,
} from "./goal-row-utils"
import { GoalsMobileCards } from "./goals-mobile-cards"
import { SEASON_FIT_ROW_ACCENT } from "./season-fit-copy"
import { SeasonCutoffRow } from "./season-fit-ui"

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
/** Header columns in `GoalsTable`, spanned by the season cut-off row. */
const COLUMN_COUNT = 8

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
  menuMoves,
  onMenuMove,
  highlightedGoalId,
  levelPotentialProgress,
  levelChargedXp,
  levelPoolXpAvailable,
  xpBook,
  reachedByGoalId,
  cascadeContext,
  projectRemoval,
  selection = EMPTY_SELECTION,
  onToggleSelected,
  visibleIds,
  onSelectAllVisible,
  seasonFit,
  seasonCutoffGoalId,
}: GoalsListProps) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
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
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead>{t("goals.columns.doneBy")}</TableHead>
          <TableHead>{t("goals.columns.remaining")}</TableHead>
          <TableHead>{t("goals.columns.progress")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SortableList
          disabled={reorderPending}
          getId={(row) => row.goalId}
          getLabel={(id) => {
            const row = rows.find((item) => item.goalId === id)
            return row ? getEntityName(row.entityType, row.entityId) : ""
          }}
          items={rows}
          onReorder={(orderedIds, movedId) => onReorder?.(orderedIds, movedId)}
          renderItem={(row, sortable) => {
            const reached = isReachedRow(row, reachedByGoalId)
            const fit = seasonFit?.fits.get(row.goalId)
            return (
              <Fragment key={row.goalId}>
                {seasonFit && seasonCutoffGoalId === row.goalId ? (
                  <SeasonCutoffRow
                    colSpan={COLUMN_COUNT}
                    seasonFit={seasonFit}
                  />
                ) : null}
                <TableRow
                  className={cn(
                    "h-16 transition-colors duration-700 data-[dragging]:relative data-[dragging]:z-10 data-[dragging]:bg-card data-[dragging]:outline-2 data-[dragging]:-outline-offset-2 data-[dragging]:outline-ring data-[just-moved]:bg-accent",
                    reached && REACHED_ROW_CLASS,
                    fit && SEASON_FIT_ROW_ACCENT[fit.offset]
                  )}
                  data-dragging={sortable.isDragging || undefined}
                  data-goal-id={row.goalId}
                  data-just-moved={
                    highlightedGoalId === row.goalId || undefined
                  }
                  data-reached={reached || undefined}
                  data-season-fit={fit?.offset}
                  data-testid="goal-row"
                  ref={sortable.setNodeRef}
                  style={sortable.style}
                >
                  <GoalRowCells
                    actions={actions}
                    cascadeContext={cascadeContext}
                    projectRemoval={projectRemoval}
                    dragHandle={sortable.dragHandle}
                    estimates={estimates}
                    levelChargedXp={levelChargedXp}
                    levelPoolXpAvailable={levelPoolXpAvailable}
                    levelPotentialProgress={levelPotentialProgress}
                    metrics={metrics}
                    moves={menuMoves?.get(row.goalId)}
                    onEdit={onEdit}
                    onMenuMove={onMenuMove}
                    popoverOpen={openPopoverGoalId === row.goalId}
                    potentialProgress={potentialProgress}
                    onToggleSelected={onToggleSelected}
                    selected={selection.has(row.goalId)}
                    reachedByGoalId={reachedByGoalId}
                    reorderEnabled={reorderEnabled}
                    row={row}
                    setOpenPopoverGoalId={setOpenPopoverGoalId}
                    seasonFit={seasonFit}
                    xpBook={xpBook}
                  />
                </TableRow>
              </Fragment>
            )
          }}
        />
      </TableBody>
    </Table>
  )
}
