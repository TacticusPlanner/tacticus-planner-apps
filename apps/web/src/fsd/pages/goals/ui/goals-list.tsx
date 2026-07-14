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
}

/** Desktop table + mobile card list for a tab's goal rows — mirrors `guild-members-list.tsx`'s
 * responsive split. Reorder (up/down) is only rendered when `reorderEnabled` (single project + Active
 * tab + list view, per the Phase 3 scope notes). */
export function GoalsList({ rows, actions, reorderEnabled, onMove }: Props) {
  const isMobile = useIsMobile()

  if (rows.length === 0) {
    return null
  }

  return isMobile ? (
    <GoalsMobileCards
      actions={actions}
      onMove={onMove}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  ) : (
    <GoalsTable
      actions={actions}
      onMove={onMove}
      reorderEnabled={reorderEnabled}
      rows={rows}
    />
  )
}

function GoalsTable({ rows, actions, reorderEnabled, onMove }: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  return (
    <Table data-testid="goals-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("goals.columns.entity")}</TableHead>
          <TableHead>{t("goals.columns.type")}</TableHead>
          <TableHead>{t("goals.columns.status")}</TableHead>
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
              <Badge variant="outline">
                {t(`goals.create.goalTypes.${row.goalType}`)}
              </Badge>
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
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

function GoalsMobileCards({ rows, actions, reorderEnabled, onMove }: Props) {
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
          <Badge className="w-fit" variant="outline">
            {t(`goals.create.goalTypes.${row.goalType}`)}
          </Badge>
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
