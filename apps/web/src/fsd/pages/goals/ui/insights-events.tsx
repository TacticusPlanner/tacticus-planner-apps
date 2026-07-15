import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateResourceId } from "../model/estimate/estimate.domain"
import { useGoalCatalog } from "../model/use-goal-catalog"
import type { CampaignInsight } from "@/shared/lib"

/** Campaign/event relevance chips annotated with which goals (entities) benefit — the "relevant
 *  campaign events... with which characters/MoW benefit from each" + "farming opportunities" piece
 *  of the Insights view (plan §16 phase 7). */
export function InsightsEvents({
  title,
  insights,
  benefitingGoalIdsByInsightId,
  goalEntityById,
}: {
  title: string
  insights: CampaignInsight<EstimateResourceId>[]
  benefitingGoalIdsByInsightId: Map<string, string[]>
  goalEntityById: ReadonlyMap<string, { entityType: string; entityId: string }>
}) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()

  if (insights.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {insights.map((insight) => {
          const goalIds = benefitingGoalIdsByInsightId.get(insight.id) ?? []
          const entityNames = [
            ...new Set(
              goalIds
                .map((goalId) => goalEntityById.get(goalId))
                .filter((entity) => !!entity)
                .map((entity) =>
                  getEntityName(entity.entityType, entity.entityId)
                )
            ),
          ]

          return (
            <div
              className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0"
              data-testid="insights-event-chip"
              key={insight.id}
            >
              <div className="flex items-center gap-2">
                {insight.icon ? (
                  <img alt="" className="size-6" src={insight.icon} />
                ) : null}
                <span className="font-medium">{insight.label}</span>
              </div>
              {entityNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {entityNames.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("goals.insights.noBenefitingGoals")}
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
