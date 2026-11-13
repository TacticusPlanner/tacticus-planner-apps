import { memo, type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { GoalTypeBadge } from "@/entities/goal"
import { useGoalCatalog, type GoalMenuMoves } from "@/features/goal-planning"
import { GoalProjectBadges, GoalUnitIcon } from "@/features/goal-create"
import type { SortableRenderProps } from "@/shared/ui"
import { GoalResourceChipList } from "../shared/goal-resource-chips"
import {
  useGoalResourceChips,
  type GoalResourceChip,
  type GoalResourceChipKind,
} from "../shared/use-goal-resource-chips"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { CoveredByNote } from "../shared/covered-by-note"
import { GoalCheckpoints } from "../shared/goal-checkpoints"
import { LevelRequirementLine } from "../shared/level-requirement-display"
import { ShardProgressBars } from "../shared/shard-progress-bars"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { GoalDragHandle } from "./goal-drag-handle"
import { GoalRowActions } from "./goal-row-actions"
import { deriveGoalRowData } from "./goal-row-data"
import {
  EstimateCell,
  GoalNameLink,
  GoalPriorityNumber,
} from "./goal-row-shared"
import {
  isInFlightStatus,
  sameRowSlice,
  stopRowNavigation,
  toggleGoalStatus,
  type GoalsListProps,
} from "./goal-row-utils"
import { SeasonFitLabel } from "./season-fit-ui"

/** Chips shown at the right end of the target row, as V1's estimate chips were. */
const ROW_END_KINDS: ReadonlySet<GoalResourceChipKind> = new Set([
  "energy",
  "onslaughtTokens",
])
/** An Ability goal's costs, on the left of its top row (V1's ability cost row). */
const ABILITY_COST_KINDS: ReadonlySet<GoalResourceChipKind> = new Set([
  "abilityBadges",
  "forgeBadges",
  "components",
  "gold",
])
/** Shown as bars instead of chips when the Ascension goal's shard progress is known. */
const SHARD_KINDS: ReadonlySet<GoalResourceChipKind> = new Set([
  "shards",
  "mythicShards",
])
const ROW_END_CHIP_CLASS = "ml-auto justify-end gap-x-2 text-xs"

type GoalCardProps = Pick<
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
  /** Desktop always; mobile only in select mode. */
  showCheckbox: boolean
  /** Desktop where reordering is available; mobile reorders in its own mode instead. */
  showDragHandle: boolean
  /** Absent where the card isn't in a sortable list. */
  dragHandle?: SortableRenderProps["dragHandle"]
  popoverOpen: boolean
  setOpenPopoverGoalId: Dispatch<SetStateAction<string | null>>
}

/**
 * One goal card, laid out like V1's goal card (header, body, ruled notes, ruled footer) from V2's own
 * row components (goal-list-layout: "Goal cards share one layout on every platform"). The caller owns
 * the card's root element (an `<li>` the sortable list positions), so this renders its content only.
 * Memoized like `GoalRowCells`, so a drag re-renders only the cheap shell.
 */
export const GoalCard = memo(
  function GoalCard({
    row,
    actions,
    onEdit = () => undefined,
    potentialProgress,
    levelPotentialProgress,
    estimates,
    cascadeContext,
    projectRemoval,
    seasonFit,
    moves,
    onMenuMove,
    onToggleSelected,
    selected,
    showCheckbox,
    showDragHandle,
    dragHandle,
    popoverOpen,
    setOpenPopoverGoalId,
    ...sources
  }: GoalCardProps) {
    const { t, i18n } = useTranslation()
    const { getEntityName } = useGoalCatalog()
    const name = getEntityName(row.entityType, row.entityId)
    const data = deriveGoalRowData(
      row,
      { ...sources, estimates },
      t,
      i18n?.resolvedLanguage
    )
    const estimate = estimates?.get(row.goalId)
    const hasLevelRow = !data.reached && !!data.levelRequirement
    const kind = row.goalType
    const shardProgress = data.remaining?.shardProgress
    const chips = useGoalResourceChips({
      energy: data.energy,
      entityType: row.entityType,
      goalType: row.goalType,
      onslaughtTokens: data.onslaughtTokens,
      remaining: data.remaining,
      shopSpend: data.shopSpend,
    })
    const chipRow = (
      keep: (chip: GoalResourceChip) => boolean,
      className = "gap-x-2 text-xs"
    ) => (
      <GoalResourceChipList chips={chips.filter(keep)} className={className} />
    )
    const rowEndChips = chipRow(
      (chip) => ROW_END_KINDS.has(chip.kind),
      ROW_END_CHIP_CLASS
    )

    return (
      <>
        {/* No onKeyDown stop around the handle: dnd-kit's keyboard sensor reads its keys on the document. */}
        <div className="flex items-start gap-2" data-testid="goal-card-header">
          <div
            className="flex shrink-0 items-center gap-1 pt-2"
            role="presentation"
            onClick={stopRowNavigation}
          >
            {showCheckbox ? (
              <Checkbox
                aria-label={t("goals.bulk.selectRow", { entity: name })}
                checked={selected}
                data-testid={`goal-row-select-${row.goalId}`}
                onCheckedChange={() => onToggleSelected?.(row.goalId)}
              />
            ) : null}
            <GoalPriorityNumber row={row} />
            {showDragHandle && dragHandle && isInFlightStatus(row.status) ? (
              <GoalDragHandle dragHandle={dragHandle} entityName={name} />
            ) : null}
          </div>
          <GoalUnitIcon
            className="size-10 shrink-0"
            entityId={row.entityId}
            entityType={row.entityType}
            name={name}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate">
              <GoalNameLink remainingText={data.remainingText} row={row} />
            </div>
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
              data-testid="goal-card-meta"
            >
              {/* A Reached card has no estimate, so it shows no placeholder for one either. */}
              {data.reached ? null : estimates ? (
                <>
                  <EstimateCell estimate={estimate} />
                  <SeasonFitLabel goalId={row.goalId} seasonFit={seasonFit} />
                </>
              ) : null}
              <GoalProjectBadges projects={row.projects ?? []} truncate />
            </div>
          </div>
          <div
            className="shrink-0"
            data-testid="goal-row-actions"
            role="presentation"
            onClick={stopRowNavigation}
            onKeyDown={stopRowNavigation}
          >
            <GoalRowActions
              actions={actions}
              cascadeContext={cascadeContext}
              moves={moves}
              onEdit={onEdit}
              onMove={(displacedGoalId) =>
                onMenuMove?.(row.goalId, displacedGoalId)
              }
              onOpenChange={(open) => {
                if (open) setOpenPopoverGoalId(null)
              }}
              projectRemoval={projectRemoval}
              reached={data.reached}
              row={row}
            />
          </div>
        </div>

        {/* V1's row positions: each row's figures sit at its right end and the rest wrap below. */}
        <div className="flex flex-col gap-2.5" data-testid="goal-card-body">
          {kind === "Ability" && !data.reached ? (
            // V1's Ability card: costs on the left of the top row and the estimate at its right end.
            <div
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              data-testid="goal-card-cost-row"
            >
              {chipRow((chip) => ABILITY_COST_KINDS.has(chip.kind))}
              {rowEndChips}
            </div>
          ) : null}
          <div
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
            data-testid="goal-card-target-row"
          >
            {/* The goal type leads the goal line: the table has a Goal column header for context, a
                card doesn't, and two goals for one unit otherwise only differ by their emblems.
                Unlock's target readout is already the word "Unlock", so it's skipped. */}
            <div
              className="flex flex-wrap items-center gap-2"
              data-testid="goal-row-target"
            >
              <GoalTypeBadge entityType={row.entityType} type={row.goalType} />
              {data.progress.kind === "Unlock" ? null : (
                <GoalTargetDisplay
                  abilityBlocks
                  entityType={row.entityType}
                  progress={data.progress}
                />
              )}
            </div>
            {data.reached || kind === "Ability" ? null : rowEndChips}
          </div>
          <CoveredByNote
            coveredBy={sources.metrics?.get(row.goalId)?.coveredBy}
          />
          {data.reached ? null : (
            <GoalCheckpoints
              estimate={estimates?.get(row.goalId)}
              goalType={row.goalType}
            />
          )}
          {/* A Reached card drops its progress area entirely rather than showing a "-" row. */}
          {data.reached ? null : kind === "Ascension" ? (
            // V1's Ascension card: the orbs on their own row, then a labelled bar per shard kind.
            <>
              {chipRow((chip) => chip.kind === "orbs")}
              <ShardProgressBars shardProgress={shardProgress} />
              {chipRow(
                (chip) =>
                  !ROW_END_KINDS.has(chip.kind) &&
                  chip.kind !== "orbs" &&
                  !(shardProgress && SHARD_KINDS.has(chip.kind))
              )}
            </>
          ) : kind === "Ability" ? (
            <>
              {hasLevelRow ? (
                <div data-testid="goal-card-level-row">
                  <LevelRequirementLine
                    booksFirst
                    className="mt-0"
                    levelRequirement={data.levelRequirement}
                    potentialRatio={levelPotentialProgress?.get(row.goalId)}
                    xpBooks={data.xpBooks}
                  />
                </div>
              ) : null}
              {chipRow(
                (chip) =>
                  !ROW_END_KINDS.has(chip.kind) &&
                  !ABILITY_COST_KINDS.has(chip.kind)
              )}
            </>
          ) : (
            <>
              <div
                role="presentation"
                onClick={stopRowNavigation}
                onKeyDown={stopRowNavigation}
              >
                <GoalProgressDisplay
                  energy={data.energy}
                  onOpenChange={(open) =>
                    setOpenPopoverGoalId(open ? row.goalId : null)
                  }
                  open={popoverOpen}
                  potentialRatio={potentialProgress?.get(row.goalId)}
                  progress={data.progress}
                  remaining={data.remaining}
                />
              </div>
              {hasLevelRow ? (
                <div data-testid="goal-card-level-row">
                  {/* XP books, the bar, the level target, then gold at the row's right end (V1's order). */}
                  <LevelRequirementLine
                    booksFirst
                    className="mt-0"
                    levelRequirement={data.levelRequirement}
                    potentialRatio={levelPotentialProgress?.get(row.goalId)}
                    trailing={chipRow((chip) => chip.kind === "gold")}
                    xpBooks={data.xpBooks}
                  />
                </div>
              ) : null}
              {chipRow(
                (chip) =>
                  !ROW_END_KINDS.has(chip.kind) &&
                  (!hasLevelRow || chip.kind !== "gold")
              )}
            </>
          )}
        </div>

        {row.notes ? (
          <div className="border-t pt-2.5">
            <p
              className="line-clamp-2 border-l-2 border-primary/40 pl-2 text-xs/snug text-muted-foreground"
              data-testid="goal-row-notes"
              title={row.notes}
            >
              {row.notes}
            </p>
          </div>
        ) : null}

        <div
          className="mt-auto flex flex-wrap items-center gap-1 border-t pt-2.5"
          data-testid="goal-card-footer"
        >
          <StatusBadge
            disabled={actions.pendingIds.has(row.goalId)}
            onToggle={(next) =>
              void toggleGoalStatus(actions, row, next, cascadeContext)
            }
            reached={data.reached}
            status={row.status}
          />
          <BlockedIndicator
            blockers={data.blockers}
            estimate={estimate}
            progress={data.progress}
          />
          {data.reached ? (
            // A Reached goal is done: offer its cleanup on the card itself, acting at once without
            // the confirmation an unreached goal's Delete asks for.
            <Button
              aria-label={t("goals.actions.deleteGoal", { entity: name })}
              className="ml-auto text-destructive hover:text-destructive"
              data-testid={`goal-card-delete-${row.goalId}`}
              disabled={actions.pendingIds.has(row.goalId)}
              onClick={(event) => {
                stopRowNavigation(event)
                void actions.remove(row.goalId)
              }}
              size="sm"
              variant="ghost"
            >
              <Trash2 data-icon="inline-start" />
              {t("goals.actions.delete")}
            </Button>
          ) : null}
        </div>
      </>
    )
  },
  (a, b) =>
    sameRowSlice(a, b, (props) => [props.showCheckbox, props.showDragHandle])
)
