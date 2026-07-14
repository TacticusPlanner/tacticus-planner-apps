import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
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

import type { EstimateResult } from "../model/estimate/estimate.domain"
import type { GoalRow } from "../model/types"
import { useGoalCatalog } from "../model/use-goal-catalog"
import type { useGoalActions } from "../model/use-goal-actions"
import { GoalRowActions } from "./goal-row-actions"
import { StatusBadge } from "./status-badge"

type Props = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  reorderEnabled: boolean
  onMove?: (goalId: string, direction: "up" | "down") => void
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — absent, or `null` for a goal
   *  entry, both render as the "—" placeholder (no project selected, non-Rank goal, or blocked). */
  estimates?: ReadonlyMap<string, EstimateResult | null>
}

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. Reorder (up/down) is only rendered when `reorderEnabled` (single project + Active
 * tab + list view, per the Phase 3 scope notes). */
export function GoalsList({
  rows,
  actions,
  reorderEnabled,
  onMove,
  estimates,
}: Props) {
  const isMobile = useIsMobile()

  if (rows.length === 0) {
    return null
  }

  return isMobile ? (
    <GoalsMobileCards
      actions={actions}
      estimates={estimates}
      onMove={onMove}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  ) : (
    <GoalsTable
      actions={actions}
      estimates={estimates}
      onMove={onMove}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  )
}

/** "{{days}}d" for a computed estimate, "—" when there's no entry for this goal (no project
 * selected, non-Rank goal type, or the farm is blocked/unreachable — plan §16 phase 4 scope notes). */
function EstimateCell({
  estimate,
}: {
  estimate: EstimateResult | null | undefined
}) {
  const { t } = useTranslation()
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

/** "M/N milestones" badge when a Rank goal has milestone breakpoints (plan §16 phase 5) — absent
 * entirely for goals with no milestones (non-Rank goals, or ones created before this phase). */
function MilestonesBadge({ row }: { row: GoalRow }) {
  const { t } = useTranslation()
  if (row.milestonesTotal <= 0) {
    return null
  }
  return (
    <Badge data-testid="goal-row-milestones" variant="secondary">
      {t("goals.milestones.count", {
        completed: row.milestonesCompleted,
        total: row.milestonesTotal,
      })}
    </Badge>
  )
}

function GoalsTable({
  rows,
  actions,
  reorderEnabled,
  onMove,
  estimates,
}: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.type")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
          <TableHead>{t("goals.columns.estimate")}</TableHead>
          <TableHead className="text-right">
            {t("goals.columns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow data-testid="goal-row" key={row.goalId}>
            <TableCell className="font-medium">
              {getEntityName(row.entityType, row.entityId)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Badge variant="outline">
                  {t(`goals.create.goalTypes.${row.goalType}`)}
                </Badge>
                <MilestonesBadge row={row} />
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>
              <EstimateCell estimate={estimates?.get(row.goalId)} />
            </TableCell>
            <TableCell>
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
}: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  return (
    <ul className="flex flex-col gap-3" data-testid="goals-list-cards">
      {rows.map((row, index) => (
        <li
          className="flex flex-col gap-2 rounded-2xl border p-3 text-sm"
          data-testid="goal-row"
          key={row.goalId}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {getEntityName(row.entityType, row.entityId)}
            </span>
            <StatusBadge status={row.status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Badge className="w-fit" variant="outline">
                {t(`goals.create.goalTypes.${row.goalType}`)}
              </Badge>
              <MilestonesBadge row={row} />
            </div>
            <EstimateCell estimate={estimates?.get(row.goalId)} />
          </div>
          <div className="flex items-center justify-end gap-1">
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
