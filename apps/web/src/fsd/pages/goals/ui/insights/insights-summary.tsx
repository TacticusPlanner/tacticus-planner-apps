import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { Rarity } from "@workspace/game-domain"
import { ASSET_BASE_PATH } from "@workspace/game-catalog"

import { energyIconUrl, EntityIcon, RarityIcon } from "@/shared/ui"

import type {
  PlanInsightsBottleneck,
  PlanInsightsTotals,
} from "../../model/insights/use-plan-insights.domain"

/** Resource-totals cards + the combined energy/completion estimate + top bottlenecks — the "total
 *  missing resources, breakdown by rarity/type" and "total energy estimate, completion timeline,
 *  bottleneck resources" pieces of the Insights view (plan §16 phase 7, replaces V1's "Total
 *  Resources Missing" accordion). */
export function InsightsSummary({
  totals,
  energyTotal,
  onslaughtTokens,
  onslaughtDays,
  completionDate,
  bottlenecks,
}: {
  totals: PlanInsightsTotals
  energyTotal: number
  onslaughtTokens: number
  onslaughtDays: number
  completionDate: string | null
  bottlenecks: PlanInsightsBottleneck[]
}) {
  const { t } = useTranslation()

  const upgradeEntries = Object.entries(totals.upgradesByRarity) as [
    Rarity,
    number,
  ][]
  const orbEntries = Object.entries(totals.orbsByType) as [Rarity, number][]

  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      data-testid="insights-summary"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EntityIcon
              alt=""
              className="size-6"
              src={`${ASSET_BASE_PATH}/upgrade-crafted-badge.png`}
            />
            {t("goals.insights.upgradesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upgradeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("goals.insights.empty")}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-3">
              {upgradeEntries.map(([rarity, count]) => (
                <li className="flex items-center gap-1.5" key={rarity}>
                  <RarityIcon className="size-5" rarity={rarity} />
                  <span className="text-sm font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EntityIcon
              alt=""
              className="size-6"
              src={`${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`}
            />
            {t("goals.insights.shardsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.shards")}
            </span>
            <span className="font-medium">{totals.shards}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.onslaughtTokens")}
            </span>
            <span className="font-medium">{onslaughtTokens}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.onslaughtDays")}
            </span>
            <span className="font-medium">{onslaughtDays.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.mythicShards")}
            </span>
            <span className="font-medium">{totals.mythicShards}</span>
          </div>
          {orbEntries.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {orbEntries.map(([rarity, count]) => (
                <div className="flex items-center gap-1.5" key={rarity}>
                  <EntityIcon
                    alt=""
                    className="size-7"
                    src={`${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.png`}
                  />
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("goals.insights.countOnlyDisclaimer")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EntityIcon
              alt=""
              className="size-6 shrink-0"
              src={energyIconUrl}
            />
            {t("goals.insights.estimateTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.energyTotal")}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <EntityIcon
                alt=""
                className="size-5 shrink-0"
                src={energyIconUrl}
              />
              {energyTotal}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.completionDate")}
            </span>
            <span
              className="font-medium"
              data-testid="insights-completion-date"
            >
              {completionDate ?? t("goals.insights.completionUnknown")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("goals.insights.bottlenecksTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {bottlenecks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("goals.insights.empty")}
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5 text-sm">
              {bottlenecks.map((bottleneck) => (
                <li className="flex justify-between gap-2" key={bottleneck.id}>
                  <span>{bottleneck.label}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <EntityIcon
                      alt=""
                      className="size-4 shrink-0"
                      src={energyIconUrl}
                    />
                    {bottleneck.energyToClear}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
