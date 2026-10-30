import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateResourceId } from "@/features/goal-farming"
import { useGoalCatalog, type PlanFarmingSpot } from "@/features/goal-planning"
import {
  CampaignInsightList,
  type CampaignInsight,
} from "@/features/campaign-insights"

import { GoalLink } from "./insights-goal-link"
import { useGoalLabel, type InsightsGoalInfo } from "./insights-view"

/** "Where to farm": the campaigns (or events) that drop the most of what the plan still needs, each
 *  summarised as how many needed resources drop there and the days to clear them, and opening to the
 *  materials, nodes and goals that benefit (plan §16 phase 7). */
export function InsightsEvents({
  title,
  insights,
  benefitingGoalIdsByInsightId,
  farmingSpotsByInsightId,
  goalInfoById,
}: {
  title: string
  insights: CampaignInsight<EstimateResourceId>[]
  benefitingGoalIdsByInsightId: Map<string, string[]>
  farmingSpotsByInsightId: ReadonlyMap<string, PlanFarmingSpot>
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
}) {
  const { t } = useTranslation()
  const { upgradesById } = useGoalCatalog()
  const goalLabel = useGoalLabel(goalInfoById)

  if (insights.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Button asChild size="sm" variant="link">
            <Link to="/plan/schedule">{t("goals.insights.openSchedule")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CampaignInsightList
          hint={t("goals.insights.farmingSpotHint")}
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
          renderSummary={(insight) => {
            const spot = farmingSpotsByInsightId.get(insight.id)
            if (!spot) return null
            return (
              <span data-testid="insights-farming-spot">
                {t("goals.insights.farmingSpot", {
                  count: spot.resourceCount,
                  days: t("goals.insights.days", {
                    count: Math.ceil(spot.days),
                  }),
                })}
              </span>
            )
          }}
          renderFooter={(insight) => {
            const goalIds = benefitingGoalIdsByInsightId.get(insight.id) ?? []
            return (
              <div
                className="mt-2 flex flex-col gap-1"
                data-testid="insights-event-chip"
              >
                {goalIds.length > 0 ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {t("goals.insights.helpsGoals")}
                    </span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {goalIds.map((goalId) => (
                        <GoalLink
                          goalId={goalId}
                          key={goalId}
                          label={goalLabel(goalId)}
                        />
                      ))}
                    </div>
                  </>
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
