import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"

import {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
} from "../../model/attainment/goal-overview-metrics-defaults"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalRowActions } from ".//goal-row-actions"
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import {
  GoalProgressDisplay,
  GoalProgressLegend,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges, GoalUnitIcon } from "../shared/goal-visuals"
import {
  LevelRequirementProgressBar,
  LevelRequirementRemaining,
  LevelRequirementTarget,
} from "../shared/level-requirement-display"
import { SortableList } from "../shared/sortable-list"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { EstimateCell, GoalNameLink } from "./goal-row-shared"
import {
  estimateEnergy,
  isInFlightStatus,
  stopRowNavigation,
  type GoalsListProps,
} from "./goal-row-utils"

export function GoalsMobileCards({
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onView = () => undefined,
  onReorder,
  reorderEnabled = false,
  mobileReorderActive = false,
  reorderPending = false,
  levelPotentialProgress,
  project,
  reachedByGoalId,
  cascadeContext,
}: GoalsListProps) {
  const { t, i18n } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const hasLegend = rows.some((row) => potentialProgress?.has(row.goalId))

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
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 data-[dragging]:opacity-60"
              data-dragging={sortable.isDragging || undefined}
              data-testid="goal-row-reorder-card"
              key={row.goalId}
              ref={sortable.setNodeRef}
              style={sortable.style}
            >
              <button
                {...sortable.dragHandle.attributes}
                {...sortable.dragHandle.listeners}
                aria-label={t("goals.columns.reorderHandle", {
                  entity: getEntityName(row.entityType, row.entityId),
                })}
                className="cursor-grab touch-none rounded-md p-2 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                data-testid="goal-row-drag-handle"
                ref={sortable.dragHandle.ref}
                type="button"
              >
                <GripVertical />
              </button>
              <GoalUnitIcon
                className="size-8"
                entityId={row.entityId}
                entityType={row.entityType}
                name={getEntityName(row.entityType, row.entityId)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {getEntityName(row.entityType, row.entityId)}
                </p>
                <GoalTargetDisplay
                  progress={
                    metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
                  }
                />
              </div>
            </li>
          )}
        />
      </ul>
    )
  }

  return (
    <>
      <GoalProgressLegend show={hasLegend} />
      <ul className="flex flex-col gap-3" data-testid="goals-list-cards">
        {rows.map((row) => {
          const progress =
            metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
          const remaining = metrics?.get(row.goalId)?.remaining ?? null
          const levelRequirement = metrics?.get(row.goalId)?.levelRequirement
          const energy = estimateEnergy(estimates?.get(row.goalId))
          const remainingText = formatGoalRemainingText(
            t,
            i18n?.resolvedLanguage,
            progress,
            remaining,
            energy
          )

          return (
            <li
              className="flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 text-sm"
              data-testid="goal-row"
              key={row.goalId}
              onClick={() => onView(row.goalId)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <GoalUnitIcon
                    className="size-8"
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
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t(`goals.create.goalTypes.${row.goalType}`)}
                      {estimates ? (
                        <EstimateCell estimate={estimates.get(row.goalId)} />
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <StatusBadge status={row.status} />
                  <BlockedIndicator
                    blockers={metrics?.get(row.goalId)?.blockers ?? NO_BLOCKERS}
                    progress={progress}
                  />
                  <div
                    data-testid="goal-row-actions"
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <GoalRowActions
                      actions={actions}
                      cascadeContext={cascadeContext}
                      project={project}
                      reached={reachedByGoalId?.get(row.goalId) ?? false}
                      row={row}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <GoalTargetDisplay progress={progress} />
              </div>
              <LevelRequirementTarget levelRequirement={levelRequirement} />
              <div onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
                <GoalProgressDisplay
                  energy={energy}
                  potentialRatio={potentialProgress?.get(row.goalId)}
                  progress={progress}
                  remaining={remaining}
                />
              </div>
              <LevelRequirementProgressBar
                levelRequirement={levelRequirement}
                potentialRatio={levelPotentialProgress?.get(row.goalId)}
              />
              <LevelRequirementRemaining levelRequirement={levelRequirement} />
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
