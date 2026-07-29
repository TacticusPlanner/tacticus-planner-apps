import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateOutcome } from "../../model/estimate/estimate.domain"
import type { GoalRow } from "../../model/shared/types"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { GoalRowActions } from ".//goal-row-actions"
import {
  GoalProjectBadges,
  GoalTypeBadge,
  GoalUnitIcon,
} from "../shared/goal-visuals"
import { StatusBadge } from "../shared/status-badge"

type Props = {
  rows: GoalRow[]
  actions: ReturnType<typeof useGoalActions>
  /** Priority-shared plan estimate per goal id (plan §16 phase 4) — see `GoalsList`'s prop doc. */
  estimates?: ReadonlyMap<string, EstimateOutcome>
  onView?: (goalId: string) => void
}

/** Card-grid view of the same rows `GoalsList` renders. No reorder here — reorder is list-view only
 * (Phase 3 scope notes). */
export function GoalsGrid({
  rows,
  actions,
  estimates,
  onView = () => undefined,
}: Props) {
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
              <div className="flex min-w-0 items-center gap-3">
                <GoalUnitIcon
                  entityId={row.entityId}
                  entityType={row.entityType}
                  name={getEntityName(row.entityType, row.entityId)}
                />
                <CardTitle className="min-w-0 text-base">
                  <Button
                    className="h-auto p-0 text-base"
                    onClick={() => onView(row.goalId)}
                    variant="link"
                  >
                    {getEntityName(row.entityType, row.entityId)}
                  </Button>
                  <GoalProjectBadges projects={row.projects ?? []} />
                </CardTitle>
              </div>
              <GoalRowActions
                actions={actions}
                goalId={row.goalId}
                status={row.status}
              />
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <GoalTypeBadge entityType={row.entityType} type={row.goalType} />
              <StatusBadge status={row.status} />
              {row.notes ? (
                <p
                  className="w-full truncate text-sm text-muted-foreground"
                  title={row.notes}
                >
                  {row.notes}
                </p>
              ) : row.goalType === "Unlock" ? (
                <p className="w-full text-sm text-muted-foreground">
                  {t("goals.unlockFlavor")}
                </p>
              ) : null}
              {estimate && estimate.status !== "Blocked" ? (
                <Badge
                  data-testid="goal-row-estimate"
                  title={estimate.date}
                  variant="secondary"
                >
                  {t("goals.estimate.days", { days: estimate.days })}
                </Badge>
              ) : estimate?.status === "Blocked" ? (
                <Badge
                  data-testid="goal-row-estimate-blocked"
                  title={t(`goals.estimate.blocked.${estimate.reason}`)}
                  variant="outline"
                >
                  {t("goals.estimate.blockedLabel")}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
