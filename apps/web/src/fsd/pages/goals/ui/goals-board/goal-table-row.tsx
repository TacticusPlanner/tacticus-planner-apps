import { memo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"
import { TableCell } from "@workspace/ui/components/table"

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
import type { SortableRenderProps } from "../shared/sortable-list"
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
  stopRowNavigation,
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
  | "xpBookRarity"
  | "project"
  | "reachedByGoalId"
  | "cascadeContext"
> & {
  row: NonNullable<GoalsListProps["rows"]>[number]
  hasLeadingCell: boolean
  reorderEnabled: boolean
  /** Stable across drag-state changes (unlike the row's transform/isDragging), so a drag moving
   *  other rows never re-renders this row's cells. */
  dragHandle: SortableRenderProps["dragHandle"]
  popoverOpen: boolean
  setOpenPopoverGoalId: Dispatch<SetStateAction<string | null>>
}

/** A desktop goal row's cells. Memoized so the drag (which re-renders every sortable row shell on
 *  each over-target change) only pays for the row's cheap `<tr>`, not its chips/hooks/actions. */
export const GoalRowCells = memo(function GoalRowCells({
  row,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onEdit = () => undefined,
  levelPotentialProgress,
  levelChargedXp,
  levelPoolXpAvailable,
  xpBookRarity,
  project,
  reachedByGoalId,
  cascadeContext,
  hasLeadingCell,
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
    <>
      {hasLeadingCell ? (
        <TableCell onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
          <div className="flex items-center gap-1">
            <GoalPriorityNumber row={row} />
            {/* Only an in-flight row can be dragged *from* — a historical row in the same
            sorted list has no handle, though it can still be a drop anchor (a neighbor
            another drag lands next to); see spliceGoalOrder. */}
            {reorderEnabled && isInFlightStatus(row.status) ? (
              <button
                {...dragHandle.attributes}
                {...dragHandle.listeners}
                aria-label={t("goals.columns.reorderHandle", {
                  entity: getEntityName(row.entityType, row.entityId),
                })}
                className="cursor-grab touch-none rounded-md p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring active:cursor-grabbing"
                data-testid="goal-row-drag-handle"
                ref={dragHandle.ref}
                type="button"
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}
          </div>
        </TableCell>
      ) : null}
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
        </div>
      </TableCell>
      <TableCell>
        {/* At most two lines inside the fixed row height; the full list is the tooltip. */}
        <div
          className="max-h-10 max-w-48 overflow-hidden"
          data-testid="goal-row-projects"
          title={(row.projects ?? []).map((project) => project.name).join(", ")}
        >
          <GoalProjectBadges projects={row.projects ?? []} />
        </div>
      </TableCell>
      <TableCell>
        <GoalTargetDisplay entityType={row.entityType} progress={progress} />
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
        {reached ? (
          <ReachedDash />
        ) : (
          <div data-testid="goal-remaining-column">
            <GoalResourceChips
              onslaughtTokens={onslaughtTokens}
              energy={energy}
              entityType={row.entityType}
              goalType={row.goalType}
              remaining={remaining}
            />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <StatusBadge reached={reached} status={row.status} />
            <BlockedIndicator
              blockers={metrics?.get(row.goalId)?.blockers ?? NO_BLOCKERS}
              progress={progress}
            />
          </div>
          {reached ? (
            <ReachedDash />
          ) : estimates ? (
            <EstimateCell estimate={estimates.get(row.goalId)} />
          ) : null}
        </div>
      </TableCell>
      <TableCell onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
        <div
          className="flex items-center justify-end gap-1"
          data-testid="goal-row-actions"
        >
          <GoalRowActions
            actions={actions}
            onEdit={onEdit}
            cascadeContext={cascadeContext}
            onOpenChange={(open) => {
              if (open) setOpenPopoverGoalId(null)
            }}
            project={project}
            reached={reached}
            row={row}
          />
        </div>
      </TableCell>
    </>
  )
})
