import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateResult } from "../model/estimate/estimate.domain"
import type { GoalRow } from "../model/types"
import { useGoalCatalog } from "../model/use-goal-catalog"
import type { useGoalActions } from "../model/use-goal-actions"
import { GoalRowActions } from "./goal-row-actions"
import { StatusBadge } from "./status-badge"

type Props = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — see `GoalsList`'s prop doc. */
  estimates?: ReadonlyMap<string, EstimateResult | null>
}

/** Card-grid view of the same rows `GoalsList` renders. No reorder here — reorder is list-view only
 * (Phase 3 scope notes). */
export function GoalsGrid({ rows, actions, estimates }: Props) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  if (rows.length === 0) {
    return null
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="goals-grid"
    >
      {rows.map((row) => {
        const estimate = estimates?.get(row.goalId)
        return (
          <Card data-testid="goal-row" key={row.goalId}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="text-base">
                {getEntityName(row.entityType, row.entityId)}
              </CardTitle>
              <GoalRowActions
                actions={actions}
                goalId={row.goalId}
                status={row.status}
              />
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge variant="outline">
                {t(`goals.create.goalTypes.${row.goalType}`)}
              </Badge>
              <StatusBadge status={row.status} />
              {row.milestonesTotal > 0 ? (
                <Badge data-testid="goal-row-milestones" variant="secondary">
                  {t("goals.milestones.count", {
                    completed: row.milestonesCompleted,
                    total: row.milestonesTotal,
                  })}
                </Badge>
              ) : null}
              {estimate ? (
                <Badge
                  data-testid="goal-row-estimate"
                  title={estimate.date}
                  variant="secondary"
                >
                  {t("goals.estimate.days", { days: estimate.days })}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
