import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { Rarity } from "@workspace/game-domain"
import { curatedAssetUrl, shardIcon } from "@workspace/game-catalog"

import { formatEstimateDate } from "@/shared/lib"
import { energyIconUrl, EntityIcon, RarityIcon } from "@/shared/ui"

import type {
  PlanInsightsBlocker,
  PlanInsightsBottleneck,
  PlanInsightsTotals,
} from "@/features/goal-planning"

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
  unestimatedGoalCount,
  bottlenecks,
  blockers,
  dailyEnergy,
}: {
  totals: PlanInsightsTotals
  energyTotal: number
  onslaughtTokens: number
  onslaughtDays: number
  completionDate: string | null
  unestimatedGoalCount: number
  bottlenecks: PlanInsightsBottleneck[]
  blockers: PlanInsightsBlocker[]
  dailyEnergy: number
}) {
  const { t, i18n } = useTranslation()
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const days = (value: number) =>
    t("goals.insights.days", { count: Math.ceil(value) })

  const upgradeEntries = Object.entries(totals.upgradesByRarity) as [
    Rarity,
    number,
  ][]

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
              src={curatedAssetUrl(`upgrade-crafted-badge.webp`)}
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
                  <span className="text-sm font-medium tabular-nums">
                    {fmt(count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EntityIcon alt="" className="size-6" src={shardIcon("Regular")} />
            {t("goals.insights.shardsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.shards")}
            </span>
            <span className="font-medium tabular-nums">
              {fmt(totals.shards)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.onslaughtTokens")}
            </span>
            <span className="font-medium tabular-nums">
              {fmt(onslaughtTokens)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.onslaughtDays")}
            </span>
            <span className="font-medium tabular-nums">
              {onslaughtDays > 0 ? days(onslaughtDays) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.mythicShards")}
            </span>
            <span className="font-medium tabular-nums">
              {fmt(totals.mythicShards)}
            </span>
          </div>
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
              {fmt(energyTotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("goals.insights.energyDays", { energy: fmt(dailyEnergy) })}
            </span>
            <span
              className="font-medium tabular-nums"
              data-testid="insights-energy-days"
            >
              {energyTotal > 0 ? days(energyTotal / dailyEnergy) : "—"}
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
              {formatEstimateDate(
                completionDate,
                i18n.resolvedLanguage ?? "en"
              ) ?? t("goals.insights.completionUnknown")}
            </span>
          </div>
          {/* The date covers only the goals that could be estimated, so the count of the rest
              travels with it — a partial date alone would read as covering the whole plan
              (plan-completion-outlook). Rendered whether or not a date is. */}
          {unestimatedGoalCount > 0 ? (
            <p
              className="text-xs text-muted-foreground"
              data-testid="insights-completion-excluded"
            >
              {t("goals.insights.completionExcluded", {
                count: unestimatedGoalCount,
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("goals.insights.bottlenecksTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {bottlenecks.length === 0 && blockers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("goals.insights.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* What no farming clears goes first: these hold goals back indefinitely. */}
              {blockers.length > 0 ? (
                <ul
                  aria-label={t("goals.insights.blockersTitle")}
                  className="flex flex-col gap-1.5 text-sm"
                >
                  {blockers.map((blocker) => (
                    <li
                      className="flex flex-col"
                      data-testid="insights-blocker"
                      key={blocker.key}
                    >
                      <span className="font-medium text-destructive">
                        {blocker.label ??
                          t("goals.insights.blockerGoals", {
                            count: blocker.goalIds.length,
                          })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`goals.estimate.blocked.${blocker.reason}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {bottlenecks.length > 0 ? (
                <ol
                  aria-label={t("goals.insights.bottlenecksTitle")}
                  className="flex flex-col gap-1.5 text-sm"
                >
                  {bottlenecks.map((bottleneck) => (
                    <li
                      className="flex justify-between gap-2"
                      data-testid="insights-bottleneck"
                      key={bottleneck.id}
                    >
                      <span>
                        {bottleneck.label}
                        <span className="text-muted-foreground tabular-nums">
                          {" "}
                          ×{fmt(bottleneck.count)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-muted-foreground tabular-nums">
                        <EntityIcon
                          alt=""
                          className="size-4 shrink-0"
                          src={energyIconUrl}
                        />
                        {fmt(bottleneck.energyToClear)}
                        <span aria-hidden>·</span>
                        {days(bottleneck.days)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
