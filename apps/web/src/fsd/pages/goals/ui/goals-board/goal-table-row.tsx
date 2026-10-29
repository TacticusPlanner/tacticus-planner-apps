import { memo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { TableCell } from "@workspace/ui/components/table"

import { NO_BLOCKERS, UNKNOWN_PROGRESS } from "@/features/goal-planning"
import { useGoalCatalog } from "@/features/goal-planning"
import { GoalRowActions } from ".//goal-row-actions"
import { GoalResourceChips } from "../shared/goal-resource-chips"
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { CoveredByNote } from "../shared/covered-by-note"
import { GoalProjectBadges, GoalUnitIcon } from "@/features/goal-create"
import { LevelRequirementLine } from "../shared/level-requirement-display"
import type { SortableRenderProps } from "@/shared/ui"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { GoalDragHandle } from "./goal-drag-handle"
import { SeasonFitLabel } from "./season-fit-ui"
import {
  EstimateCell,
  GoalNameLink,
  GoalPriorityNumber,
  ReachedDash,
} from "./goal-row-shared"
import {
  estimateEnergy,
  estimateOnslaughtTokens,
  estimateShopSpend,
  isInFlightStatus,
  isReachedRow,
  goalXpBookFigure,
  sameRowSlice,
  stopRowNavigation,
  toggleGoalStatus,
  type GoalsListProps,
} from "./goal-row-utils"

type GoalRowCellsProps = Pick<
  GoalsListProps,
  | "actions"
  | "estimates"
  | "metrics"
  | "potentialProgress"
  | "onEdit"
  | "levelPotentialProgress"
  | "levelChargedXp"
  | "levelPoolXpAvailable"
  | "xpBook"
  | "onToggleSelected"
  | "reachedByGoalId"
  | "cascadeContext"
  | "projectRemoval"
  | "seasonFit"
> & {
  row: NonNullable<GoalsListProps["rows"]>[number]
  selected: boolean
  reorderEnabled: boolean
  /** Stable across drag-state changes (unlike the row's transform/isDragging), so a drag moving
   *  other rows never re-renders this row's cells. */
  dragHandle: SortableRenderProps["dragHandle"]
  popoverOpen: boolean
  setOpenPopoverGoalId: Dispatch<SetStateAction<string | null>>
}

/** A desktop goal row's cells. Memoized so the drag (which re-renders every sortable row shell on
 *  each over-target change) only pays for the row's cheap `<tr>`, not its chips/hooks/actions. */
export const GoalRowCells = memo(
  function GoalRowCells({
    row,
    actions,
    estimates,
    metrics,
    potentialProgress,
    onEdit = () => undefined,
    levelPotentialProgress,
    levelChargedXp,
    levelPoolXpAvailable,
    xpBook,
    reachedByGoalId,
    cascadeContext,
    projectRemoval,
    seasonFit,
    onToggleSelected,
    selected,
    reorderEnabled,
    dragHandle,
    popoverOpen,
    setOpenPopoverGoalId,
  }: GoalRowCellsProps) {
    const { t, i18n } = useTranslation()
    const { getEntityName } = useGoalCatalog()
    const progress = metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
    const remaining = metrics?.get(row.goalId)?.remaining ?? null
    const levelRequirement = metrics?.get(row.goalId)?.levelRequirement
    const energy = estimateEnergy(estimates?.get(row.goalId))
    const onslaughtTokens = estimateOnslaughtTokens(estimates?.get(row.goalId))
    const shopSpend = estimateShopSpend(estimates?.get(row.goalId))
    const reached = isReachedRow(row, reachedByGoalId)
    const xpBooks = reached
      ? undefined
      : goalXpBookFigure(
          levelChargedXp?.get(row.goalId),
          levelPoolXpAvailable?.get(row.goalId),
          xpBook
        )
    const remainingText = formatGoalRemainingText(
      t,
      i18n?.resolvedLanguage,
      progress,
      remaining,
      energy
    )

    return (
      <>
        {/* No onKeyDown stop here: dnd-kit's keyboard sensor reads the drag handle's arrow, drop and
          Escape keys on the document, so they must bubble. */}
        <TableCell onClick={stopRowNavigation}>
          <div className="flex items-center gap-2">
            <Checkbox
              aria-label={t("goals.bulk.selectRow", {
                entity: getEntityName(row.entityType, row.entityId),
              })}
              checked={selected}
              data-testid={`goal-row-select-${row.goalId}`}
              onCheckedChange={() => onToggleSelected?.(row.goalId)}
            />
            <div className="flex items-center gap-1">
              <GoalPriorityNumber row={row} />
              {/* Only an in-flight row can be dragged *from* — a historical row in the same
            sorted list has no handle, though it can still be a drop anchor (a neighbor
            another drag lands next to); see spliceGoalOrder. */}
              {reorderEnabled && isInFlightStatus(row.status) ? (
                <GoalDragHandle
                  dragHandle={dragHandle}
                  entityName={getEntityName(row.entityType, row.entityId)}
                />
              ) : null}
            </div>
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <GoalUnitIcon
              entityId={row.entityId}
              entityType={row.entityType}
              name={getEntityName(row.entityType, row.entityId)}
            />
            <div className="min-w-0">
              <GoalNameLink remainingText={remainingText} row={row} />
              {row.notes ? (
                <p
                  className="max-w-64 truncate text-xs font-normal text-muted-foreground"
                  data-testid="goal-row-notes"
                  title={row.notes}
                >
                  {row.notes}
                </p>
              ) : null}
            </div>
            <div
              className="ml-auto"
              data-testid={`goal-row-menu-${row.goalId}`}
              role="presentation"
              onClick={stopRowNavigation}
              onKeyDown={stopRowNavigation}
            >
              <GoalRowActions
                actions={actions}
                cascadeContext={cascadeContext}
                onEdit={onEdit}
                projectRemoval={projectRemoval}
                onOpenChange={(open) => {
                  if (open) setOpenPopoverGoalId(null)
                }}
                reached={reached}
                row={row}
              />
            </div>
          </div>
        </TableCell>
        <TableCell>
          {/* At most two lines inside the fixed row height; the full list is the tooltip. */}
          <div
            className="max-h-10 max-w-48 overflow-hidden"
            data-testid="goal-row-projects"
            title={(row.projects ?? [])
              .map((project) => project.name)
              .join(", ")}
          >
            <GoalProjectBadges projects={row.projects ?? []} />
          </div>
        </TableCell>
        <TableCell>
          <GoalTargetDisplay entityType={row.entityType} progress={progress} />
          <CoveredByNote coveredBy={metrics?.get(row.goalId)?.coveredBy} />
        </TableCell>
        <TableCell
          className="min-w-[220px]"
          onClick={stopRowNavigation}
          onKeyDown={stopRowNavigation}
        >
          {reached ? (
            <ReachedDash />
          ) : (
            <>
              <GoalProgressDisplay
                energy={energy}
                onOpenChange={(open) =>
                  setOpenPopoverGoalId(open ? row.goalId : null)
                }
                open={popoverOpen}
                potentialRatio={potentialProgress?.get(row.goalId)}
                progress={progress}
                remaining={remaining}
              />
              <LevelRequirementLine
                levelRequirement={levelRequirement}
                potentialRatio={levelPotentialProgress?.get(row.goalId)}
                xpBooks={xpBooks}
              />
            </>
          )}
        </TableCell>
        <TableCell>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-1">
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
            </div>
            {reached ? (
              <ReachedDash />
            ) : estimates ? (
              // Fixed slot: a Paused goal has no estimate and must not collapse the row.
              <div className="flex min-h-4 flex-wrap items-center gap-x-2">
                <EstimateCell estimate={estimates.get(row.goalId)} />
                <SeasonFitLabel goalId={row.goalId} seasonFit={seasonFit} />
              </div>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="min-w-[260px]">
          {reached ? (
            <ReachedDash />
          ) : (
            <div data-testid="goal-remaining-column">
              <GoalResourceChips
                onslaughtTokens={onslaughtTokens}
                shopSpend={shopSpend}
                energy={energy}
                entityType={row.entityType}
                goalType={row.goalType}
                remaining={remaining}
              />
            </div>
          )}
        </TableCell>
      </>
    )
  },
  (a, b) => sameRowSlice(a, b, (props) => [props.reorderEnabled])
)
