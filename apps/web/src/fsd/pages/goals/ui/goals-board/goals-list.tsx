import type { KeyboardEvent, SyntheticEvent } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, LockKeyhole } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { GoalOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"
import type { EstimateOutcome } from "../../model/estimate/estimate.domain"
import type { GoalRow } from "../../model/shared/types"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { GoalRowActions } from ".//goal-row-actions"
import {
  GoalProgressDisplay,
  GoalProjectBadges,
  GoalRemainingSummary,
  GoalTypeBadge,
  GoalUnitIcon,
} from "../shared/goal-visuals"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"

type Props = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  reorderEnabled: boolean
  onMove?: (goalId: string, direction: "up" | "down") => void
  onView?: (goalId: string) => void
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — absent, or `null` for a goal
   *  entry, both render as the "—" placeholder (no project selected, non-Rank goal, or blocked). */
  estimates?: ReadonlyMap<string, EstimateOutcome>
  /** Progress + remaining-resource info per goal id (plan §2) — absent renders neither. */
  metrics?: ReadonlyMap<string, GoalOverviewMetrics>
}

/** Stops a click/keyboard activation on an inner control (the actions menu, reorder buttons) from
 * also bubbling up to the row/card's own "open detail" handler. */
function stopRowNavigation(event: SyntheticEvent<HTMLElement>): void {
  event.stopPropagation()
}

/** Enter/Space activates the row/card's own "open detail" handler — but only when the row/card
 * itself has focus, not when a nested control (button, menu item) does; those already handle their
 * own key activation and stop the event from reaching here (see `stopRowNavigation`). */
function handleRowKeyDown(
  event: KeyboardEvent<HTMLElement>,
  onOpen: () => void
): void {
  if (event.target !== event.currentTarget) return
  if (event.key !== "Enter" && event.key !== " ") return
  event.preventDefault()
  onOpen()
}

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. The whole row/card is clickable (opens the goal's detail view); the actions menu
 * and reorder buttons stop that click/keydown from bubbling so they keep working independently.
 * Reorder (up/down) is only rendered when `reorderEnabled` (single project + Active tab + list view,
 * per the Phase 3 scope notes). */
export function GoalsList({
  rows,
  actions,
  reorderEnabled,
  onMove,
  onView = () => undefined,
  estimates,
  metrics,
}: Props) {
  const isMobile = useIsMobile()

  if (rows.length === 0) {
    return null
  }

  return isMobile ? (
    <GoalsMobileCards
      actions={actions}
      estimates={estimates}
      metrics={metrics}
      onMove={onMove}
      onView={onView}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  ) : (
    <GoalsTable
      actions={actions}
      estimates={estimates}
      metrics={metrics}
      onMove={onMove}
      onView={onView}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  )
}

/** "{{days}}d" for a computed estimate, "—" when there's no entry for this goal (no project
 * selected, non-Rank goal type, or the farm is blocked/unreachable — plan §16 phase 4 scope notes). */
function EstimateCell({ estimate }: { estimate: EstimateOutcome | undefined }) {
  const { t } = useTranslation()
  if (estimate?.status === "Blocked") {
    return (
      <span
        className="inline-flex items-center gap-1 text-amber-700"
        data-testid="goal-row-estimate-blocked"
        title={t(`goals.estimate.blocked.${estimate.reason}`)}
      >
        <LockKeyhole className="size-3.5" />
        {t("goals.estimate.blockedLabel")}
      </span>
    )
  }
  return (
    <span
      className="text-muted-foreground"
      data-testid="goal-row-estimate"
      title={estimate?.date}
    >
      {estimate
        ? t("goals.estimate.days", { days: estimate.days })
        : t("goals.estimate.none")}
    </span>
  )
}

function GoalsTable({
  rows,
  actions,
  reorderEnabled,
  onMove,
  estimates,
  metrics,
  onView = () => undefined,
}: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.type")}</TableHead>
          <TableHead>{t("goals.columns.progress")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead>{t("goals.columns.estimate")}</TableHead>
          <TableHead className="text-right">
            {t("goals.columns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow
            aria-label={getEntityName(row.entityType, row.entityId)}
            className="cursor-pointer"
            data-testid="goal-row"
            key={row.goalId}
            onClick={() => onView(row.goalId)}
            onKeyDown={(event) =>
              handleRowKeyDown(event, () => onView(row.goalId))
            }
            role="button"
            tabIndex={0}
          >
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <GoalUnitIcon
                  entityId={row.entityId}
                  entityType={row.entityType}
                  name={getEntityName(row.entityType, row.entityId)}
                />
                <div className="min-w-0">
                  <p className="font-medium">
                    {getEntityName(row.entityType, row.entityId)}
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
              ) : row.goalType === "Unlock" ? (
                <p className="text-xs font-normal text-muted-foreground">
                  {t("goals.unlockFlavor")}
                </p>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <GoalTypeBadge
                  entityType={row.entityType}
                  type={row.goalType}
                />
              </div>
            </TableCell>
            <TableCell className="min-w-40">
              <GoalProgressDisplay
                progress={
                  metrics?.get(row.goalId)?.progress ?? { kind: "Unknown" }
                }
              />
              <GoalRemainingSummary
                remaining={metrics?.get(row.goalId)?.remaining ?? null}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1">
                <StatusBadge status={row.status} />
                <BlockedIndicator
                  blockers={
                    metrics?.get(row.goalId)?.blockers ?? {
                      reasons: [],
                      isBlocked: false,
                    }
                  }
                />
              </div>
            </TableCell>
            <TableCell>
              <EstimateCell estimate={estimates?.get(row.goalId)} />
            </TableCell>
            <TableCell
              onClick={stopRowNavigation}
              onKeyDown={stopRowNavigation}
            >
              <div className="flex items-center justify-end gap-1">
                {reorderEnabled ? (
                  <>
                    <Button
                      aria-label={t("goals.actions.moveUp")}
                      data-testid={`goal-row-move-up-${row.goalId}`}
                      disabled={index === 0}
                      onClick={() => onMove?.(row.goalId, "up")}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      aria-label={t("goals.actions.moveDown")}
                      data-testid={`goal-row-move-down-${row.goalId}`}
                      disabled={index === rows.length - 1}
                      onClick={() => onMove?.(row.goalId, "down")}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronDown />
                    </Button>
                  </>
                ) : null}
                <GoalRowActions
                  actions={actions}
                  goalId={row.goalId}
                  status={row.status}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GoalsMobileCards({
  rows,
  actions,
  reorderEnabled,
  onMove,
  estimates,
  metrics,
  onView = () => undefined,
}: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  return (
    <ul className="flex flex-col gap-3" data-testid="goals-list-cards">
      {rows.map((row, index) => (
        <li
          aria-label={getEntityName(row.entityType, row.entityId)}
          className="flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 text-sm"
          data-testid="goal-row"
          key={row.goalId}
          onClick={() => onView(row.goalId)}
          onKeyDown={(event) =>
            handleRowKeyDown(event, () => onView(row.goalId))
          }
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <GoalUnitIcon
                className="size-9"
                entityId={row.entityId}
                entityType={row.entityType}
                name={getEntityName(row.entityType, row.entityId)}
              />
              <div className="min-w-0">
                <p className="font-medium">
                  {getEntityName(row.entityType, row.entityId)}
                </p>
                <GoalProjectBadges projects={row.projects ?? []} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <StatusBadge status={row.status} />
              <BlockedIndicator
                blockers={
                  metrics?.get(row.goalId)?.blockers ?? {
                    reasons: [],
                    isBlocked: false,
                  }
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <GoalTypeBadge entityType={row.entityType} type={row.goalType} />
            </div>
            <EstimateCell estimate={estimates?.get(row.goalId)} />
          </div>
          <GoalProgressDisplay
            progress={metrics?.get(row.goalId)?.progress ?? { kind: "Unknown" }}
          />
          <GoalRemainingSummary
            remaining={metrics?.get(row.goalId)?.remaining ?? null}
          />
          {row.notes ? (
            <p className="truncate text-muted-foreground" title={row.notes}>
              {row.notes}
            </p>
          ) : row.goalType === "Unlock" ? (
            <p className="text-muted-foreground">{t("goals.unlockFlavor")}</p>
          ) : null}
          <div
            className="flex items-center justify-end gap-1"
            onClick={stopRowNavigation}
            onKeyDown={stopRowNavigation}
          >
            {reorderEnabled ? (
              <>
                <Button
                  aria-label={t("goals.actions.moveUp")}
                  disabled={index === 0}
                  onClick={() => onMove?.(row.goalId, "up")}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ChevronUp />
                </Button>
                <Button
                  aria-label={t("goals.actions.moveDown")}
                  disabled={index === rows.length - 1}
                  onClick={() => onMove?.(row.goalId, "down")}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ChevronDown />
                </Button>
              </>
            ) : null}
            <GoalRowActions
              actions={actions}
              goalId={row.goalId}
              status={row.status}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
