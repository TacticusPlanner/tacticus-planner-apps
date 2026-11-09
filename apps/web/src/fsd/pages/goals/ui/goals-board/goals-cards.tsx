import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { useGoalCatalog } from "@/features/goal-planning"
import { SortableList, type SortableRenderProps } from "@/shared/ui"
import { ProgressLegend } from "../shared/goal-progress-visuals"
import { GoalCard } from "./goal-card"
import {
  drawsPotentialBar,
  isReachedRow,
  REACHED_ROW_CLASS,
  type GoalsListProps,
} from "./goal-row-utils"
import { SEASON_FIT_CARD_ACCENT } from "./season-fit-copy"
import { SeasonCutoffItem } from "./season-fit-ui"

const EMPTY_SELECTION: ReadonlySet<string> = new Set()

/** Columns at least 380px wide (or the full width, when narrower) filling the row. */
const GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(min(23.75rem,100%),1fr))] items-stretch gap-3"

/** Cards view's select-all, one above every group: it covers every visible goal across groups
 *  (goal-bulk-actions), so under a group heading it would read as that group's. */
export function GoalsCardsSelectAll({
  selection,
  visibleIds,
  onSelectAll,
}: {
  selection: ReadonlySet<string>
  visibleIds: readonly string[]
  onSelectAll: () => void
}) {
  const { t } = useTranslation()
  const selectedCount = visibleIds.filter((id) => selection.has(id)).length
  const allSelected =
    visibleIds.length > 0 && selectedCount === visibleIds.length
  return (
    <label
      className="flex w-fit items-center gap-2 text-sm text-muted-foreground"
      data-testid="goals-cards-select-all"
    >
      <Checkbox
        aria-label={t("goals.bulk.selectAll")}
        checked={
          allSelected ? true : selectedCount > 0 ? "indeterminate" : false
        }
        data-testid="goals-select-all"
        onCheckedChange={onSelectAll}
      />
      {t("goals.bulk.selectAll")}
    </label>
  )
}

/**
 * The goal cards grid, the same component on every platform (goal-list-layout: "Goal cards share one
 * layout on every platform"). Below the mobile breakpoint the grid collapses to one column, checkboxes
 * appear only in select mode, and reordering happens in the separate reorder mode instead of through
 * an inline handle.
 */
export function GoalsCards({
  isMobile,
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onEdit,
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
  selectActive = false,
  seasonFit,
  seasonCutoffGoalId,
}: GoalsListProps & { isMobile: boolean }) {
  const { getEntityName } = useGoalCatalog()
  const [openPopoverGoalId, setOpenPopoverGoalId] = useState<string | null>(
    null
  )
  const showLegend = rows.some((row) =>
    drawsPotentialBar(
      row,
      { metrics, potentialProgress, levelPotentialProgress, reachedByGoalId },
      "Cards"
    )
  )

  const renderCard = (
    row: (typeof rows)[number],
    sortable?: SortableRenderProps
  ) => {
    const reached = isReachedRow(row, reachedByGoalId)
    const fit = seasonFit?.fits.get(row.goalId)
    return (
      <Fragment key={row.goalId}>
        {seasonFit && seasonCutoffGoalId === row.goalId ? (
          <SeasonCutoffItem seasonFit={seasonFit} />
        ) : null}
        <li
          className={cn(
            "flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3 text-sm shadow-xs transition-colors duration-700 data-dragging:relative data-dragging:z-10 data-dragging:border-ring data-dragging:shadow-lg data-just-moved:bg-accent",
            reached && REACHED_ROW_CLASS,
            fit && SEASON_FIT_CARD_ACCENT[fit.offset]
          )}
          data-dragging={sortable?.isDragging || undefined}
          data-goal-id={row.goalId}
          data-just-moved={highlightedGoalId === row.goalId || undefined}
          data-reached={reached || undefined}
          data-season-fit={fit?.offset}
          data-testid="goal-row"
          ref={sortable?.setNodeRef}
          style={sortable?.style}
        >
          <GoalCard
            actions={actions}
            cascadeContext={cascadeContext}
            dragHandle={sortable?.dragHandle}
            estimates={estimates}
            levelChargedXp={levelChargedXp}
            levelPoolXpAvailable={levelPoolXpAvailable}
            levelPotentialProgress={levelPotentialProgress}
            metrics={metrics}
            moves={menuMoves?.get(row.goalId)}
            onEdit={onEdit}
            onMenuMove={onMenuMove}
            onToggleSelected={onToggleSelected}
            popoverOpen={openPopoverGoalId === row.goalId}
            potentialProgress={potentialProgress}
            projectRemoval={projectRemoval}
            reachedByGoalId={reachedByGoalId}
            row={row}
            seasonFit={seasonFit}
            selected={selection.has(row.goalId)}
            setOpenPopoverGoalId={setOpenPopoverGoalId}
            showCheckbox={isMobile ? selectActive : true}
            showDragHandle={!isMobile && reorderEnabled}
            xpBook={xpBook}
          />
        </li>
      </Fragment>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {showLegend ? <ProgressLegend /> : null}
      <ul className={GRID_CLASS} data-testid="goals-list-cards">
        {/* Phones reorder in their own mode, so nothing here could start a drag. */}
        {isMobile ? (
          rows.map((row) => renderCard(row))
        ) : (
          <SortableList
            disabled={reorderPending || !reorderEnabled}
            getId={(row) => row.goalId}
            getLabel={(id) => {
              const row = rows.find((item) => item.goalId === id)
              return row ? getEntityName(row.entityType, row.entityId) : ""
            }}
            items={rows}
            onReorder={(orderedIds, movedId) =>
              onReorder?.(orderedIds, movedId)
            }
            strategy="grid"
            renderItem={renderCard}
          />
        )}
      </ul>
    </div>
  )
}
