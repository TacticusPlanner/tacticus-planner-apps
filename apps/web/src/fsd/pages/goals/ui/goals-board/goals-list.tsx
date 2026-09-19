import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import {
  GoalProgressDisplay,
  GoalProgressLegend,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges, GoalUnitIcon } from "../shared/goal-visuals"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"
import { EstimateCell, GoalNameLink } from "./goal-row-shared"
import {
  estimateEnergy,
  stopRowNavigation,
  type GoalsListProps,
} from "./goal-row-utils"
import { GoalsMobileCards } from "./goals-mobile-cards"

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. The whole row/card is clickable (opens the goal's detail view); the actions menu
 * and nested buttons stop activation from bubbling so they keep working independently.
 * Reorder (up/down) is only rendered when `reorderEnabled` (single project + Active tab + list view,
 * per the Phase 3 scope notes). */
export function GoalsList({
  rows,
  actions,
  onView = () => undefined,
  estimates,
  metrics,
  potentialProgress,
  project,
}: GoalsListProps) {
  const isMobile = useIsMobile()

  if (rows.length === 0) {
    return null
  }

  return isMobile ? (
    <GoalsMobileCards
      actions={actions}
      estimates={estimates}
      metrics={metrics}
      potentialProgress={potentialProgress}
      onView={onView}
      project={project}
      rows={rows}
    />
  ) : (
    <GoalsTable
      actions={actions}
      estimates={estimates}
      metrics={metrics}
      potentialProgress={potentialProgress}
      onView={onView}
      project={project}
      rows={rows}
    />
  )
}

function GoalsTable({
  rows,
  actions,
  estimates,
  metrics,
  potentialProgress,
  onView = () => undefined,
  project,
}: GoalsListProps) {
  const { t, i18n } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const [openPopoverGoalId, setOpenPopoverGoalId] = useState<string | null>(
    null
  )
  const hasLegend = rows.some((row) => potentialProgress?.has(row.goalId))

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("goals.columns.entity")}</TableHead>
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
        {rows.map((row) => {
          const progress =
            metrics?.get(row.goalId)?.progress ?? UNKNOWN_PROGRESS
          const remaining = metrics?.get(row.goalId)?.remaining ?? null
          const energy = estimateEnergy(estimates?.get(row.goalId))
          const remainingText = formatGoalRemainingText(
            t,
            i18n?.resolvedLanguage,
            progress,
            remaining,
            energy
          )

          return (
            <TableRow
              className="h-14 cursor-pointer"
              data-testid="goal-row"
              key={row.goalId}
              onClick={() => onView(row.goalId)}
            >
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
                    <p className="text-xs text-muted-foreground">
                      {t(`goals.create.goalTypes.${row.goalType}`)}
                    </p>
                    <GoalProjectBadges projects={row.projects ?? []} />
                  </div>
                </div>
                {row.notes ? (
                  <p
                    className="max-w-64 truncate text-xs font-normal text-muted-foreground"
                    title={row.notes}
                  >
                    {row.notes}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <GoalTargetDisplay progress={progress} />
              </TableCell>
              <TableCell
                className="min-w-[220px]"
                onClick={stopRowNavigation}
                onKeyDown={stopRowNavigation}
              >
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
              </TableCell>
              <TableCell>
                {remainingText ? (
                  <span
                    className="block max-w-[190px] truncate text-xs text-muted-foreground"
                    data-testid="goal-remaining-column"
                    title={remainingText}
                  >
                    {remainingText}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <StatusBadge status={row.status} />
                    <BlockedIndicator
                      blockers={
                        metrics?.get(row.goalId)?.blockers ?? NO_BLOCKERS
                      }
                      progress={progress}
                    />
                  </div>
                  {estimates ? (
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
                    onOpenChange={(open) => {
                      if (open) setOpenPopoverGoalId(null)
                    }}
                    project={project}
                    row={row}
                  />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
