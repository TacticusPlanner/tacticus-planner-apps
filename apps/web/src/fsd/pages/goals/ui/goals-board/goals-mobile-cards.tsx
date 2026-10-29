import { Fragment, memo } from "react"
import { cn } from "@workspace/ui/lib/utils"

import { UNKNOWN_PROGRESS } from "@/features/goal-planning"
import { useGoalCatalog } from "@/features/goal-planning"
import { GoalDragHandle } from "./goal-drag-handle"
import { GoalTargetDisplay } from "../shared/goal-progress-visuals"
import { GoalUnitIcon } from "@/features/goal-create"
import { SortableList, type SortableRenderProps } from "@/shared/ui"
import { GoalsCards } from "./goals-cards"
import { SEASON_FIT_CARD_ACCENT } from "./season-fit-copy"
import { SeasonCutoffItem, SeasonFitLabel } from "./season-fit-ui"
import { StatusBadge } from "../shared/status-badge"
import { GoalPriorityNumber } from "./goal-row-shared"
import {
  isInFlightStatus,
  isReachedRow,
  type GoalsListProps,
} from "./goal-row-utils"

type ReorderCardBodyProps = {
  row: NonNullable<GoalsListProps["rows"]>[number]
  progress: Parameters<typeof GoalTargetDisplay>[0]["progress"]
  reached: boolean
  seasonFit: GoalsListProps["seasonFit"]
  /** Stable across drag-state changes, so a drag moving other cards never re-renders this body. */
  dragHandle: SortableRenderProps["dragHandle"]
}

/** A reorder card's content. Memoized so the drag (which re-renders every sortable `<li>` shell on
 *  each over-target change) only pays for the cheap shell, not the handle/icon/name/target. */
const ReorderCardBody = memo(function ReorderCardBody({
  row,
  progress,
  reached,
  seasonFit,
  dragHandle,
}: ReorderCardBodyProps) {
  const { getEntityName } = useGoalCatalog()
  const name = getEntityName(row.entityType, row.entityId)
  return (
    <>
      <GoalDragHandle dragHandle={dragHandle} entityName={name} size="touch" />
      <GoalPriorityNumber row={row} />
      <GoalUnitIcon
        className="size-8"
        entityId={row.entityId}
        entityType={row.entityType}
        name={name}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <GoalTargetDisplay entityType={row.entityType} progress={progress} />
        <SeasonFitLabel goalId={row.goalId} seasonFit={seasonFit} />
      </div>
      {/* State stays readable as text in this mode too (a Paused row would otherwise look like an Active one). */}
      <StatusBadge reached={reached} status={row.status} />
    </>
  )
})

/** The mobile list: the shared goal cards, or, while reorder mode is on, the collapsed drag-only cards
 *  (global-goal-priority: mobile reorders in its own mode). */
export function GoalsMobileCards(props: GoalsListProps) {
  const {
    rows,
    metrics,
    onReorder,
    reorderEnabled = false,
    mobileReorderActive = false,
    reorderPending = false,
    reachedByGoalId,
    seasonFit,
    seasonCutoffGoalId,
  } = props
  const { getEntityName } = useGoalCatalog()

  if (!(reorderEnabled && mobileReorderActive)) {
    return <GoalsCards {...props} isMobile />
  }

  const seasonFitAccent = (goalId: string) => {
    const fit = seasonFit?.fits.get(goalId)
    return fit ? SEASON_FIT_CARD_ACCENT[fit.offset] : null
  }
  // Only in-flight rows are worth showing in reorder mode — a historical row has nothing to
  // reorder and would just be inert clutter in a screen whose only purpose is dragging.
  const reorderableRows = rows.filter((row) => isInFlightStatus(row.status))
  return (
    <ul className="flex flex-col gap-2" data-testid="goals-list-reorder-cards">
      <SortableList
        disabled={reorderPending}
        getId={(row) => row.goalId}
        getLabel={(id) => {
          const row = reorderableRows.find((item) => item.goalId === id)
          return row ? getEntityName(row.entityType, row.entityId) : ""
        }}
        items={reorderableRows}
        onReorder={(orderedIds, movedId) => onReorder?.(orderedIds, movedId)}
        renderItem={(row, sortable) => (
          <Fragment key={row.goalId}>
            {seasonFit && seasonCutoffGoalId === row.goalId ? (
              <SeasonCutoffItem seasonFit={seasonFit} />
            ) : null}
            <li
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-3 data-[dragging]:relative data-[dragging]:z-10 data-[dragging]:border-ring data-[dragging]:shadow-lg",
                seasonFitAccent(row.goalId)
              )}
              data-dragging={sortable.isDragging || undefined}
              data-testid="goal-row-reorder-card"
              ref={sortable.setNodeRef}
              style={sortable.style}
            >
              <ReorderCardBody
                dragHandle={sortable.dragHandle}
                progress={
                  metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
                }
                reached={isReachedRow(row, reachedByGoalId)}
                row={row}
                seasonFit={seasonFit}
              />
            </li>
          </Fragment>
        )}
      />
    </ul>
  )
}
