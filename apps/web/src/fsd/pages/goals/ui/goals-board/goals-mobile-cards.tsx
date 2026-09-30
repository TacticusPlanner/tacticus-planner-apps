import { memo } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox } from "@workspace/ui/components/checkbox"

import {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
} from "../../model/attainment/goal-overview-metrics-defaults"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalRowActions } from ".//goal-row-actions"
import { GoalResourceChips } from "../shared/goal-resource-chips"
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges, GoalUnitIcon } from "../shared/goal-visuals"
import { LevelRequirementLine } from "../shared/level-requirement-display"
import { SortableList, type SortableRenderProps } from "../shared/sortable-list"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import {
  EstimateCell,
  GoalNameLink,
  GoalPriorityNumber,
  ReachedDash,
} from "./goal-row-shared"
import {
  estimateEnergy,
  estimateOnslaughtTokens,
  isInFlightStatus,
  isReachedRow,
  goalXpBookFigure,
  REACHED_ROW_CLASS,
  stopRowNavigation,
  toggleGoalStatus,
  type GoalsListProps,
} from "./goal-row-utils"

type ReorderCardBodyProps = {
  row: NonNullable<GoalsListProps["rows"]>[number]
  progress: Parameters<typeof GoalTargetDisplay>[0]["progress"]
  reached: boolean
  /** Stable across drag-state changes, so a drag moving other cards never re-renders this body. */
  dragHandle: SortableRenderProps["dragHandle"]
}

/** A reorder card's content. Memoized so the drag (which re-renders every sortable `<li>` shell on
 *  each over-target change) only pays for the cheap shell, not the handle/icon/name/target. */
const ReorderCardBody = memo(function ReorderCardBody({
  row,
  progress,
  reached,
  dragHandle,
}: ReorderCardBodyProps) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const name = getEntityName(row.entityType, row.entityId)
  const { ref: setHandleNode, attributes, listeners } = dragHandle
  return (
    <>
      <button
        {...attributes}
        {...listeners}
        aria-label={t("goals.columns.reorderHandle", { entity: name })}
        className="cursor-grab touch-none rounded-md p-2 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring active:cursor-grabbing"
        data-testid="goal-row-drag-handle"
        ref={setHandleNode}
        type="button"
      >
        <GripVertical />
      </button>
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
      </div>
      {/* State stays readable as text in this mode too (a Paused row would otherwise look like an Active one). */}
      <StatusBadge reached={reached} status={row.status} />
    </>
  )
})

export function GoalsMobileCards({
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onEdit = () => undefined,
  onReorder,
  reorderEnabled = false,
  mobileReorderActive = false,
  reorderPending = false,
  levelPotentialProgress,
  levelChargedXp,
  levelPoolXpAvailable,
  xpBookRarity,
  reachedByGoalId,
  cascadeContext,
  selection,
  onToggleSelected,
  selectActive = false,
}: GoalsListProps) {
  const { t, i18n } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  if (reorderEnabled && mobileReorderActive) {
    // Only in-flight rows are worth showing in reorder mode — a historical row has nothing to
    // reorder and would just be inert clutter in a screen whose only purpose is dragging.
    const reorderableRows = rows.filter((row) => isInFlightStatus(row.status))
    return (
      <ul
        className="flex flex-col gap-2"
        data-testid="goals-list-reorder-cards"
      >
        <SortableList
          disabled={reorderPending}
          getId={(row) => row.goalId}
          items={reorderableRows}
          onReorder={(orderedIds, movedId) => onReorder?.(orderedIds, movedId)}
          renderItem={(row, sortable) => (
            <li
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 data-[dragging]:relative data-[dragging]:z-10 data-[dragging]:border-ring data-[dragging]:shadow-lg"
              data-dragging={sortable.isDragging || undefined}
              data-testid="goal-row-reorder-card"
              key={row.goalId}
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
              />
            </li>
          )}
        />
      </ul>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3" data-testid="goals-list-cards">
        {rows.map((row) => {
          const progress =
            metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
          const remaining = metrics?.get(row.goalId)?.remaining ?? null
          const levelRequirement = metrics?.get(row.goalId)?.levelRequirement
          const energy = estimateEnergy(estimates?.get(row.goalId))
          const onslaughtTokens = estimateOnslaughtTokens(
            estimates?.get(row.goalId)
          )
          const reached = isReachedRow(row, reachedByGoalId)
          const xpBooks = reached
            ? undefined
            : goalXpBookFigure(
                levelChargedXp?.get(row.goalId),
                levelPoolXpAvailable?.get(row.goalId),
                xpBookRarity
              )
          const remainingText = formatGoalRemainingText(
            t,
            i18n?.resolvedLanguage,
            progress,
            remaining,
            energy
          )

          return (
            <li
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-3 text-sm",
                reached && REACHED_ROW_CLASS
              )}
              data-reached={reached || undefined}
              data-testid="goal-row"
              key={row.goalId}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {selectActive ? (
                    <div
                      onClick={stopRowNavigation}
                      onKeyDown={stopRowNavigation}
                    >
                      <Checkbox
                        aria-label={t("goals.bulk.selectRow", {
                          entity: getEntityName(row.entityType, row.entityId),
                        })}
                        checked={selection?.has(row.goalId) ?? false}
                        data-testid={`goal-row-select-${row.goalId}`}
                        onCheckedChange={() => onToggleSelected?.(row.goalId)}
                      />
                    </div>
                  ) : null}
                  <GoalPriorityNumber row={row} />
                  <GoalUnitIcon
                    className="size-8"
                    entityId={row.entityId}
                    entityType={row.entityType}
                    name={getEntityName(row.entityType, row.entityId)}
                  />
                  <div className="min-w-0">
                    <GoalNameLink remainingText={remainingText} row={row} />
                    {reached ? (
                      <ReachedDash />
                    ) : estimates ? (
                      <EstimateCell estimate={estimates.get(row.goalId)} />
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <StatusBadge
                    disabled={actions.pendingIds.has(row.goalId)}
                    onToggle={(next) =>
                      void toggleGoalStatus(actions, row, next, cascadeContext)
                    }
                    reached={reached}
                    status={row.status}
                  />
                  <BlockedIndicator
                    blockers={metrics?.get(row.goalId)?.blockers ?? NO_BLOCKERS}
                    estimate={estimates?.get(row.goalId)}
                    progress={progress}
                  />
                  <div
                    data-testid="goal-row-actions"
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <GoalRowActions
                      actions={actions}
                      onEdit={onEdit}
                      cascadeContext={cascadeContext}
                      reached={reached}
                      row={row}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <GoalTargetDisplay
                  entityType={row.entityType}
                  progress={progress}
                />
              </div>
              {reached ? (
                <ReachedDash />
              ) : (
                <>
                  <div
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <GoalProgressDisplay
                      energy={energy}
                      potentialRatio={potentialProgress?.get(row.goalId)}
                      progress={progress}
                      remaining={remaining}
                    />
                  </div>
                  <LevelRequirementLine
                    levelRequirement={levelRequirement}
                    potentialRatio={levelPotentialProgress?.get(row.goalId)}
                    xpBooks={xpBooks}
                  />
                  <GoalResourceChips
                    onslaughtTokens={onslaughtTokens}
                    energy={energy}
                    entityType={row.entityType}
                    goalType={row.goalType}
                    remaining={remaining}
                  />
                </>
              )}
              {row.notes ? (
                <p className="truncate text-muted-foreground" title={row.notes}>
                  {row.notes}
                </p>
              ) : null}
              <GoalProjectBadges projects={row.projects ?? []} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
