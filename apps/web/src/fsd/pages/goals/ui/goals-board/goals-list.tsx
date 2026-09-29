import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

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
  GoalProgressLegend,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges, GoalUnitIcon } from "../shared/goal-visuals"
import { LevelRequirementLine } from "../shared/level-requirement-display"
import { SortableList } from "../shared/sortable-list"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import {
  EstimateCell,
  GoalNameLink,
  GoalPriorityNumber,
  ReachedDash,
} from "./goal-row-shared"
import {
  estimateEnergy,
  isInFlightStatus,
  isReachedRow,
  goalXpBookFigure,
  REACHED_ROW_CLASS,
  stopRowNavigation,
  type GoalsListProps,
} from "./goal-row-utils"
import { GoalsMobileCards } from "./goals-mobile-cards"

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. The whole row/card is clickable (opens the goal's detail view); the actions menu
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

function GoalsTable({
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onView = () => undefined,
  onReorder,
  reorderEnabled = false,
  reorderPending = false,
  levelPotentialProgress,
  levelChargedXp,
  levelPoolXpAvailable,
  xpBookRarity,
  project,
  reachedByGoalId,
  cascadeContext,
}: GoalsListProps) {
  const { t, i18n } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const [openPopoverGoalId, setOpenPopoverGoalId] = useState<string | null>(
    null
  )
  const hasLegend = rows.some((row) => potentialProgress?.has(row.goalId))
  // The leading cell holds the drag handle and/or the priority number; it is not a data column.
  const hasLeadingCell =
    reorderEnabled ||
    rows.some(
      (row) => row.priority !== undefined && isInFlightStatus(row.status)
    )

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          {hasLeadingCell ? (
            <TableHead className="w-16">
              <span className="sr-only">{t("goals.columns.reorder")}</span>
            </TableHead>
          ) : null}
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.projects")}</TableHead>
          <TableHead>{t("goals.columns.goal")}</TableHead>
          <TableHead>
            <span className="flex items-center gap-2">
              {t("goals.columns.progress")}
              <GoalProgressLegend show={hasLegend} />
            </span>
          </TableHead>
          <TableHead>{t("goals.columns.remaining")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">{t("goals.columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SortableList
          disabled={reorderPending}
          getId={(row) => row.goalId}
          items={rows}
          onReorder={(orderedIds, movedId) => onReorder?.(orderedIds, movedId)}
          renderItem={(row, sortable) => {
            const progress =
              metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
            const remaining = metrics?.get(row.goalId)?.remaining ?? null
            const levelRequirement = metrics?.get(row.goalId)?.levelRequirement
            const energy = estimateEnergy(estimates?.get(row.goalId))
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
              <TableRow
                className={cn(
                  "h-14 cursor-pointer data-[dragging]:relative data-[dragging]:z-10 data-[dragging]:bg-card data-[dragging]:outline-2 data-[dragging]:-outline-offset-2 data-[dragging]:outline-ring",
                  reached && REACHED_ROW_CLASS
                )}
                data-dragging={sortable.isDragging || undefined}
                data-goal-id={row.goalId}
                data-reached={reached || undefined}
                data-testid="goal-row"
                key={row.goalId}
                onClick={() => onView(row.goalId)}
                ref={sortable.setNodeRef}
                style={sortable.style}
              >
                {hasLeadingCell ? (
                  <TableCell
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <div className="flex items-center gap-1">
                      <GoalPriorityNumber row={row} />
                      {/* Only an in-flight row can be dragged *from* — a historical row in the same
                        sorted list has no handle, though it can still be a drop anchor (a neighbor
                        another drag lands next to); see spliceGoalOrder. */}
                      {reorderEnabled && isInFlightStatus(row.status) ? (
                        <button
                          {...sortable.dragHandle.attributes}
                          {...sortable.dragHandle.listeners}
                          aria-label={t("goals.columns.reorderHandle", {
                            entity: getEntityName(row.entityType, row.entityId),
                          })}
                          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring active:cursor-grabbing"
                          data-testid="goal-row-drag-handle"
                          ref={sortable.dragHandle.ref}
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
                      <GoalNameLink
                        onView={onView}
                        remainingText={remainingText}
                        row={row}
                      />
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
                    title={(row.projects ?? [])
                      .map((project) => project.name)
                      .join(", ")}
                  >
                    <GoalProjectBadges projects={row.projects ?? []} />
                  </div>
                </TableCell>
                <TableCell>
                  <GoalTargetDisplay
                    entityType={row.entityType}
                    progress={progress}
                  />
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
                        open={openPopoverGoalId === row.goalId}
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
                        blockers={
                          metrics?.get(row.goalId)?.blockers ?? NO_BLOCKERS
                        }
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
                <TableCell
                  onClick={stopRowNavigation}
                  onKeyDown={stopRowNavigation}
                >
                  <div
                    className="flex items-center justify-end gap-1"
                    data-testid="goal-row-actions"
                  >
                    <GoalRowActions
                      actions={actions}
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
              </TableRow>
            )
          }}
        />
      </TableBody>
    </Table>
  )
}
