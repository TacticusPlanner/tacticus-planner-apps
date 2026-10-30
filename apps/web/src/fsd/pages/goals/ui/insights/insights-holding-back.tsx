import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { energyIconUrl, EntityIcon } from "@/shared/ui"

import type {
  PlanInsightsBlocker,
  PlanInsightsBottleneck,
} from "@/features/goal-planning"

import { GoalLink } from "./insights-goal-link"
import {
  useGoalLabel,
  useGoalUnitNames,
  type InsightsGoalInfo,
} from "./insights-view"

/** "What's holding you back": what no farming clears (blockers, with the goals they stop), then the
 *  farmable resources that take the most energy, each with the units waiting on it. */
export function InsightsHoldingBack({
  blockers,
  bottlenecks,
  goalInfoById,
}: {
  blockers: PlanInsightsBlocker[]
  bottlenecks: PlanInsightsBottleneck[]
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
}) {
  const { t, i18n } = useTranslation()
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const listFormat = new Intl.ListFormat(i18n.resolvedLanguage)
  const goalLabel = useGoalLabel(goalInfoById)
  const unitNames = useGoalUnitNames(goalInfoById)

  return (
    <Card data-testid="insights-holding-back">
      <CardHeader>
        <CardTitle>{t("goals.insights.holdingBackTitle")}</CardTitle>
        <CardDescription>
          {t("goals.insights.holdingBackDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {blockers.length === 0 && bottlenecks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("goals.insights.holdingBackNone")}
          </p>
        ) : null}
        {blockers.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-destructive">
              {t("goals.insights.blockersTitle")}
            </h3>
            <ul
              aria-label={t("goals.insights.blockersTitle")}
              className="flex flex-col gap-3 text-sm"
            >
              {blockers.map((blocker) => (
                <li
                  className="flex flex-col gap-0.5"
                  data-testid="insights-blocker"
                  key={blocker.key}
                >
                  <span className="font-medium">
                    {blocker.label
                      ? `${blocker.label} ×${fmt(blocker.remaining)}`
                      : t("goals.insights.blockerGoals", {
                          count: blocker.goalIds.length,
                        })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`goals.estimate.blocked.${blocker.reason}`)}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    {blocker.goalIds.map((goalId) => (
                      <GoalLink
                        goalId={goalId}
                        key={goalId}
                        label={goalLabel(goalId)}
                      />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {bottlenecks.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {t("goals.insights.bottlenecksTitle")}
            </h3>
            <ol
              aria-label={t("goals.insights.bottlenecksTitle")}
              className="flex flex-col gap-3 text-sm"
            >
              {bottlenecks.map((bottleneck) => {
                const units = unitNames(bottleneck.goalIds)
                return (
                  <li
                    className="flex flex-col gap-0.5"
                    data-testid="insights-bottleneck"
                    key={bottleneck.id}
                  >
                    <span className="flex justify-between gap-2">
                      <span className="min-w-0">
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
                        {t("goals.insights.days", {
                          count: Math.ceil(bottleneck.days),
                        })}
                      </span>
                    </span>
                    {units.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t("goals.insights.neededFor", {
                          units: listFormat.format(units),
                        })}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}
