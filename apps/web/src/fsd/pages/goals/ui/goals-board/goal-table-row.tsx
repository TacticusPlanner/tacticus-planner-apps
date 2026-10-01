import { memo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  estimateShopSpend,
  isInFlightStatus,
  isReachedRow,
  goalXpBookFigure,
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
  | "xpBookRarity"
  | "onToggleSelected"
  | "reachedByGoalId"
  | "cascadeContext"
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
  reachedByGoalId,
  cascadeContext,
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
      <TableCell onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
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
            onClick={stopRowNavigation}
            onKeyDown={stopRowNavigation}
          >
            <GoalRowActions
              actions={actions}
              cascadeContext={cascadeContext}
              onEdit={onEdit}
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
            <div className="min-h-4">
              <EstimateCell estimate={estimates.get(row.goalId)} />
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
}, sameRowProps)

/** Memo comparator: maps and `actions` are rebuilt on every page render (a pause/resume rebuilds the
 *  cascade context, estimates and `pendingIds` for the whole list), so compare only this row's slice
 *  of each. Functions other than `onToggleSelected` are omitted on purpose: `actions` and `onEdit`
 *  only act on ids/state read at call time, and `setOpenPopoverGoalId` is a state setter. */
function sameRowProps(a: GoalRowCellsProps, b: GoalRowCellsProps) {
  const id = a.row.goalId
  if (id !== b.row.goalId || a.row !== b.row) return false
  const scalar = (props: GoalRowCellsProps) => [
    props.selected,
    props.reorderEnabled,
    props.popoverOpen,
    props.xpBookRarity,
    props.actions.pendingIds.has(id),
    props.onToggleSelected,
    props.dragHandle,
  ]
  const perId = (props: GoalRowCellsProps) => [
    props.estimates?.get(id),
    props.metrics?.get(id),
    props.potentialProgress?.get(id),
    props.levelPotentialProgress?.get(id),
    props.levelChargedXp?.get(id),
    props.levelPoolXpAvailable?.get(id),
    props.reachedByGoalId?.get(id),
    ...(a.row.dependsOn ?? []).flatMap((dep) => [
      props.cascadeContext?.statusById.get(dep),
      props.cascadeContext?.dependentCountById.get(dep),
    ]),
  ]
  const same = (x: unknown[], y: unknown[]) =>
    x.length === y.length && x.every((value, k) => Object.is(value, y[k]))
  return same(scalar(a), scalar(b)) && same(perId(a), perId(b))
}
