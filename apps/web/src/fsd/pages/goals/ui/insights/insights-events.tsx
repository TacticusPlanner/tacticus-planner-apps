import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { EstimateResourceId } from "@/entities/goal-farming"
import { useGoalCatalog } from "@/features/goal-planning"
import type { PlanFarmingSpot } from "@/features/goal-planning"
import { CampaignInsightList } from "@/entities/campaign-insight"
import type { CampaignInsight } from "@/entities/campaign-insight"

import { energyIconUrl, EntityIcon } from "@/shared/ui"
import { numberFormat } from "@/shared/lib"

import { GoalLink } from "./insights-goal-link"
import { useGoalLabel } from "../../model/insights/insights-view"
import type { InsightsGoalInfo } from "../../model/insights/insights-view"

/** Energy to farm one of the needed items there, at the campaign's cheapest node for each. */
const energyPerItem = (spot: PlanFarmingSpot) =>
  spot.itemCount > 0 ? spot.energy / spot.itemCount : 0

/** How many campaigns (or events) a card lists before "Show all". */
const TOP_COUNT = 3

/** "Where to farm": the campaigns (or events) that drop the most of what the plan still needs, each
 *  summarised as how many needed resources drop there and the days to clear them, and opening to the
 *  materials, nodes and goals that benefit (plan §16 phase 7). */
export function InsightsEvents({
  title,
  description,
  emptyText,
  insights,
  benefitingGoalIdsByInsightId,
  farmingSpotsByInsightId,
  goalInfoById,
}: {
  title: string
  /** A line under the title (the events card says it covers events that are not running). */
  description?: string
  /** Shown in place of the list when nothing ranks; without it the card is hidden instead. */
  emptyText?: string
  insights: CampaignInsight<EstimateResourceId>[]
  benefitingGoalIdsByInsightId: Map<string, string[]>
  farmingSpotsByInsightId: ReadonlyMap<string, PlanFarmingSpot>
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
}) {
  const { t, i18n } = useTranslation()
  const { upgradesById } = useGoalCatalog()
  const number = numberFormat(i18n.resolvedLanguage, {
    maximumFractionDigits: 0,
  })
  const percent = numberFormat(i18n.resolvedLanguage, {
    style: "percent",
    maximumFractionDigits: 0,
  })
  const goalLabel = useGoalLabel(goalInfoById)
  const [showAll, setShowAll] = useState(false)

  if (insights.length === 0 && !emptyText) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <Button asChild size="sm" variant="link">
            <Link to="/plan/schedule">{t("goals.insights.openSchedule")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="insights-events-empty"
          >
            {emptyText}
          </p>
        ) : null}
        <CampaignInsightList
          hint={t("goals.insights.farmingSpotHint")}
          label={title}
          insights={showAll ? insights : insights.slice(0, TOP_COUNT)}
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
              <span
                className="inline-flex items-center gap-1"
                data-testid="insights-farming-spot"
              >
                {t("goals.insights.farmingSpotShare", {
                  share: percent.format(spot.coverage),
                })}
                <span aria-hidden>·</span>
                <EntityIcon
                  size="icon"
                  alt={t("goals.insights.energy")}
                  className="shrink-0"
                  src={energyIconUrl}
                />
                {t("goals.insights.perItem", {
                  energy: number.format(energyPerItem(spot)),
                })}
              </span>
            )
          }}
          renderFooter={(insight) => {
            const goalIds = benefitingGoalIdsByInsightId.get(insight.id) ?? []
            const spot = farmingSpotsByInsightId.get(insight.id)
            return (
              <div
                className="mt-2 flex flex-col gap-1"
                data-testid="insights-event-chip"
              >
                {spot ? (
                  <p
                    className="text-xs text-muted-foreground"
                    data-testid="insights-farming-spot-detail"
                  >
                    {t("goals.insights.farmingSpotDetail", {
                      count: spot.itemCount,
                      items: number.format(spot.itemCount),
                      resources: spot.resourceCount,
                      energy: number.format(spot.energy),
                      days: t("goals.insights.days", {
                        count: Math.ceil(spot.days),
                      }),
                    })}
                  </p>
                ) : null}
                {goalIds.length > 0 ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {t("goals.insights.helpsGoals")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {goalIds.map((goalId) => (
                        <GoalLink
                          goalId={goalId}
                          info={goalInfoById.get(goalId)}
                          key={goalId}
                          label={goalLabel(goalId)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("goals.insights.noBenefitingGoals")}
                  </p>
                )}
              </div>
            )
          }}
        />
        {insights.length > TOP_COUNT ? (
          <Button
            className="mt-2"
            data-testid="insights-events-show-all"
            onClick={() => setShowAll((value) => !value)}
            size="sm"
            variant="ghost"
          >
            {showAll
              ? t("goals.insights.showLess")
              : t("goals.insights.showAll", { count: insights.length })}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
