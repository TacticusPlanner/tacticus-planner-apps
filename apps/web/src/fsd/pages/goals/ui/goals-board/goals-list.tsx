import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
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
import {
  ProgressExplainer,
  ProgressLegend,
} from "../shared/goal-progress-visuals"
import { GoalRowCells } from "./goal-table-row"
import { GoalsCards } from "./goals-cards"
import {
  drawsPotentialBar,
  isReachedRow,
  REACHED_ROW_CLASS,
} from "./goal-row-utils"
import type { GoalsListProps } from "./goal-row-utils"
import { GoalsReorderCards } from "./goals-reorder-cards"
import { goalFitOffset, SEASON_FIT_ROW_ACCENT } from "./season-fit-copy"
import { SeasonCutoffRow } from "./season-fit-ui"
import type { GoalsView } from "./use-goals-view"

/** A tab's goal rows as the goal cards or the table (goal-list-layout), by this device's stored Goals
 * view. Mobile reorder mode always shows its collapsed cards. The row itself opens nothing;
 * its Edit action opens the Edit goal dialog, and the actions and nested buttons stop activation from
 * bubbling so they keep working independently. `reorderEnabled` shows a drag handle on every desktop
 * row or card directly (no separate mode); mobile additionally needs `mobileReorderActive`
 * (add-inline-goal-reprioritize). */
export function GoalsList({
  view,
  ...props
}: GoalsListProps & { view: GoalsView }) {
  const isMobile = useIsMobile()
  const { rows, reorderEnabled, mobileReorderActive } = props

  if (rows.length === 0) {
    return null
  }

  if (isMobile && reorderEnabled && mobileReorderActive) {
    return <GoalsReorderCards {...props} />
  }
  return view === "Table" ? (
    <GoalsTable {...props} isMobile={isMobile} />
  ) : (
    <GoalsCards {...props} isMobile={isMobile} />
  )
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set()
/** Header columns in `GoalsTable`, spanned by the season cut-off row. */
const COLUMN_COUNT = 9
/** A header class that shrinks its column to the widest cell's content. */
const FIT_COLUMN = "w-px"

function GoalsTable({
  isMobile,
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
  onJumpToGoal,
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
  selectActive = false,
  seasonFit,
  seasonCutoffGoalId,
  eventEndCutoffGoalId,
}: GoalsListProps & { isMobile: boolean }) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  // Select-all covers every visible row (across groups), not just this table's rows.
  const scopeIds = visibleIds ?? rows.map((row) => row.goalId)
  const selectedCount = scopeIds.filter((id) => selection.has(id)).length
  const allSelected = scopeIds.length > 0 && selectedCount === scopeIds.length
  // Like the cards: checkboxes only exist in select mode (the toolbar's Select goals).
  const showCheckboxes = selectActive
  const showLegend = rows.some((row) =>
    drawsPotentialBar(
      row,
      { metrics, potentialProgress, levelPotentialProgress, reachedByGoalId },
      "Table"
    )
  )

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          {/* Columns size to their content (`w-px` shrinks a column to its widest cell, which never
              wraps), so short goals don't leave wide gaps and long names never collide with the
              actions button; Remaining alone takes the leftover width (UserJot "Improve goals
              table layout"). */}
          <TableHead className={FIT_COLUMN}>
            <div className="flex items-center gap-2">
              {showCheckboxes ? (
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
              ) : null}
              <span className="sr-only">{t("goals.columns.reorder")}</span>
            </div>
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {t("goals.columns.entity")}
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {t("goals.columns.projects")}
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {t("goals.columns.goal")}
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {t("goals.columns.status")}
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {t("goals.columns.doneBy")}
          </TableHead>
          <TableHead className={FIT_COLUMN}>
            {/* Not obvious from the word alone how it differs from Done by: the tooltip says. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="cursor-default rounded-sm underline decoration-dotted underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  data-testid="goals-duration-header"
                  type="button"
                >
                  {t("goals.columns.duration")}
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("goals.columns.durationHelp")}</TooltipContent>
            </Tooltip>
          </TableHead>
          <TableHead>{t("goals.columns.remaining")}</TableHead>
          <TableHead className="w-40">
            {showLegend ? (
              <div className="grid gap-0.5 py-1">
                <span className="flex items-center justify-between gap-1">
                  {t("goals.columns.progress")}
                  {/* The list's one "i": the rows carry no per-goal explanation on desktop. */}
                  {isMobile ? null : <ProgressExplainer />}
                </span>
                {/* Stacked: side by side it would widen this deliberately narrow column. */}
                <ProgressLegend className="flex-col items-start gap-0" />
              </div>
            ) : (
              t("goals.columns.progress")
            )}
          </TableHead>
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
            const fitOffset = goalFitOffset(seasonFit, row.goalId)
            return (
              <Fragment key={row.goalId}>
                {seasonFit && seasonCutoffGoalId === row.goalId ? (
                  <SeasonCutoffRow
                    goalId={row.goalId}
                    colSpan={COLUMN_COUNT}
                    seasonFit={seasonFit}
                  />
                ) : null}
                {seasonFit && eventEndCutoffGoalId === row.goalId ? (
                  <SeasonCutoffRow
                    goalId={row.goalId}
                    colSpan={COLUMN_COUNT}
                    edge="end"
                    seasonFit={seasonFit}
                  />
                ) : null}
                <TableRow
                  className={cn(
                    "h-16 transition-colors duration-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-dragging:relative data-dragging:z-10 data-dragging:bg-card data-dragging:outline-2 data-dragging:-outline-offset-2 data-dragging:outline-ring data-just-moved:bg-accent",
                    reached && REACHED_ROW_CLASS,
                    fitOffset !== undefined && SEASON_FIT_ROW_ACCENT[fitOffset]
                  )}
                  data-dragging={sortable.isDragging || undefined}
                  data-goal-id={row.goalId}
                  data-just-moved={
                    highlightedGoalId === row.goalId || undefined
                  }
                  data-reached={reached || undefined}
                  data-season-fit={fitOffset}
                  data-testid="goal-row"
                  tabIndex={-1}
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
                    onJumpToGoal={onJumpToGoal}
                    onMenuMove={onMenuMove}
                    potentialProgress={potentialProgress}
                    onToggleSelected={onToggleSelected}
                    selected={selection.has(row.goalId)}
                    reachedByGoalId={reachedByGoalId}
                    reorderEnabled={reorderEnabled && !isMobile}
                    row={row}
                    showCheckbox={showCheckboxes}
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
