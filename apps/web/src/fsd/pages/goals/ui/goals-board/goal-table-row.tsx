import { memo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { TableCell } from "@workspace/ui/components/table"

import { useGoalCatalog, type GoalMenuMoves } from "@/features/goal-planning"
import { GoalDragHandle } from "./goal-drag-handle"
import { GoalRowActions } from ".//goal-row-actions"
import { GoalResourceChips } from "../shared/goal-resource-chips"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { CoveredByNote } from "../shared/covered-by-note"
import { GoalCheckpoints } from "../shared/goal-checkpoints"
import { GoalProjectBadges, GoalUnitIcon } from "@/features/goal-create"
import { LevelRequirementLine } from "../shared/level-requirement-display"
import type { SortableRenderProps } from "@/shared/ui"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { SeasonFitLabel } from "./season-fit-ui"
import {
  EstimateCell,
  GoalNameLink,
  GoalPriorityNumber,
  ReachedDash,
} from "./goal-row-shared"
import { deriveGoalRowData } from "./goal-row-data"
import {
  isInFlightStatus,
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
  | "onMenuMove"
> & {
  moves: GoalMenuMoves | undefined
  row: NonNullable<GoalsListProps["rows"]>[number]
  selected: boolean
  reorderEnabled: boolean
  /** Off on mobile outside select mode, where nothing could act on a selection. */
  showCheckbox: boolean
  /** Stable across drag-state changes (unlike the row's transform/isDragging), so a drag moving
   *  other rows never re-renders this row's cells. */
  dragHandle: SortableRenderProps["dragHandle"]
  popoverOpen: boolean
  setOpenPopoverGoalId: Dispatch<SetStateAction<string | null>>
}

/** A goal row's cells. Memoized so the drag (which re-renders every sortable row shell on
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
  xpBook,
  reachedByGoalId,
  cascadeContext,
  projectRemoval,
  seasonFit,
  moves,
  onMenuMove,
  onToggleSelected,
  selected,
  reorderEnabled,
  showCheckbox,
  dragHandle,
  popoverOpen,
  setOpenPopoverGoalId,
}: GoalRowCellsProps) {
  const { t, i18n } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const {
    progress,
    remaining,
    levelRequirement,
    blockers,
    energy,
    onslaughtTokens,
    shopSpend,
    reached,
    xpBooks,
    remainingText,
  } = deriveGoalRowData(
    row,
    {
      estimates,
      metrics,
      levelChargedXp,
      levelPoolXpAvailable,
      xpBook,
      reachedByGoalId,
    },
    t,
    i18n?.resolvedLanguage
  )

  return (
    <>
      {/* No onKeyDown stop here: dnd-kit's keyboard sensor reads the drag handle's arrow, drop and
          Escape keys on the document, so they must bubble. */}
      <TableCell onClick={stopRowNavigation}>
        <div className="flex items-center gap-2">
          {showCheckbox ? (
            <Checkbox
              aria-label={t("goals.bulk.selectRow", {
                entity: getEntityName(row.entityType, row.entityId),
              })}
              checked={selected}
              data-testid={`goal-row-select-${row.goalId}`}
              onCheckedChange={() => onToggleSelected?.(row.goalId)}
            />
          ) : null}
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
        {/* `w-max`: the avatar image counts for no width in this content-sized column, which pushed the
            actions button out of the cell and under the Projects column. */}
        <div className="flex w-max min-w-full items-center gap-3">
          <GoalUnitIcon
            className="size-12"
            entityId={row.entityId}
            entityType={row.entityType}
            name={getEntityName(row.entityType, row.entityId)}
          />
          {/* No min-w-0: the name keeps its full width, so a squeezed table can never slide it under
              the actions button beside it (UserJot "Improve goals table layout"). */}
          <div>
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
            className="ml-auto shrink-0"
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
              moves={moves}
              onMove={(displacedGoalId) =>
                onMenuMove?.(row.goalId, displacedGoalId)
              }
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
          className="max-h-10 w-max max-w-48 overflow-hidden"
          data-testid="goal-row-projects"
          title={(row.projects ?? []).map((project) => project.name).join(", ")}
        >
          <GoalProjectBadges projects={row.projects ?? []} />
        </div>
      </TableCell>
      <TableCell>
        <GoalTargetDisplay
          entityType={row.entityType}
          progress={progress}
          size="lg"
        />
        <CoveredByNote coveredBy={metrics?.get(row.goalId)?.coveredBy} />
        {reached ? null : (
          <GoalCheckpoints
            estimate={estimates?.get(row.goalId)}
            goalType={row.goalType}
          />
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <StatusBadge
            className="px-2.5 py-1 text-sm"
            disabled={actions.pendingIds.has(row.goalId)}
            onToggle={(next) =>
              void toggleGoalStatus(actions, row, next, cascadeContext)
            }
            reached={reached}
            status={row.status}
          />
          <BlockedIndicator
            className="px-2.5 py-1 text-sm"
            blockers={blockers}
            estimate={estimates?.get(row.goalId)}
            progress={progress}
          />
        </div>
      </TableCell>
      <TableCell>
        {reached ? (
          <ReachedDash />
        ) : estimates ? (
          <div className="grid gap-0.5">
            <EstimateCell estimate={estimates.get(row.goalId)} stacked />
            <SeasonFitLabel goalId={row.goalId} seasonFit={seasonFit} />
          </div>
        ) : null}
      </TableCell>
      {/* The one column without a fixed or content width: it takes whatever the table has left, and
          its chips wrap inside it rather than pushing the table into a horizontal scroll. */}
      <TableCell className="min-w-56 whitespace-normal">
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
      {/* Last and narrow: the bar is the least scannable figure in the row (UserJot "V2 goals page
          is harder to scan"); the date, days and energy columns come first. */}
      <TableCell
        className="w-40 min-w-40"
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
    </>
  )
}, sameRowProps)

function sameRowProps(a: GoalRowCellsProps, b: GoalRowCellsProps) {
  return sameRowSlice(a, b, (props) => [
    props.reorderEnabled,
    props.showCheckbox,
  ])
}
