import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateResourceId } from "@/features/goal-farming"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import {
  CampaignInsightList,
  type CampaignInsight,
} from "@/features/campaign-insights"

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
  const { getEntityName, upgradesById } = useGoalCatalog()

  if (insights.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CampaignInsightList
          label={title}
          insights={insights}
          resourceById={
            new Map(
              [...upgradesById].map(([id, upgrade]) => [
                id,
                {
                  id,
                  label: upgrade.label,
                  rarity: upgrade.rarity,
                  crafted: upgrade.crafted,
                },
              ])
            )
          }
          renderFooter={(insight) => {
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
                className="mt-2 flex flex-col gap-2"
                data-testid="insights-event-chip"
              >
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
          }}
        />
      </CardContent>
    </Card>
  )
}
