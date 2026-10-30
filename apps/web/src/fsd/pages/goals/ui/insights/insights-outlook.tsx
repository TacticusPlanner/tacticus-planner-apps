import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatEstimateDate } from "@/shared/lib"
import { energyIconUrl, EntityIcon } from "@/shared/ui"

import type {
  PlanInsightsExcludedGoal,
  PlanInsightsGoalOutlook,
} from "@/features/goal-planning"

import { GoalLink } from "./insights-goal-link"
import {
  criticalGoals,
  daysUntil,
  useGoalLabel,
  type InsightsGoalInfo,
} from "./insights-view"

/** The Insights headline: when the plan is done, at what energy, which goals set that date, and
 *  which goals the date leaves out and why. */
export function InsightsOutlook({
  completionDate,
  energyTotal,
  dailyEnergy,
  onslaughtDays,
  goalOutlook,
  excludedGoals,
  goalInfoById,
}: {
  completionDate: string | null
  energyTotal: number
  dailyEnergy: number
  onslaughtDays: number
  goalOutlook: PlanInsightsGoalOutlook[]
  excludedGoals: PlanInsightsExcludedGoal[]
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const goalLabel = useGoalLabel(goalInfoById)
  const date = formatEstimateDate(completionDate, locale)
  const critical = criticalGoals(goalOutlook)

  return (
    <Card data-testid="insights-outlook">
      <CardHeader>
        <CardDescription>{t("goals.insights.outlookTitle")}</CardDescription>
        <CardTitle
          className="text-2xl font-semibold"
          data-testid="insights-completion-date"
        >
          {date
            ? t("goals.insights.doneBy", { date })
            : t("goals.insights.completionUnknown")}
        </CardTitle>
        {completionDate ? (
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span>
              {t("goals.insights.days", {
                count: daysUntil(completionDate),
              })}
            </span>
            <span aria-hidden>·</span>
            <EntityIcon
              alt=""
              className="size-4 shrink-0"
              src={energyIconUrl}
            />
            <span data-testid="insights-energy-summary">
              {t("goals.insights.energySummary", {
                energy: fmt(energyTotal),
                daily: fmt(dailyEnergy),
              })}
            </span>
          </p>
        ) : null}
        {onslaughtDays > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("goals.insights.onslaughtWait", {
              count: Math.ceil(onslaughtDays),
            })}
          </p>
        ) : null}
      </CardHeader>
      {critical.length > 0 || excludedGoals.length > 0 ? (
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {critical.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">
                {t("goals.insights.criticalTitle")}
              </h3>
              <ol
                aria-label={t("goals.insights.criticalTitle")}
                className="flex flex-col gap-1.5 text-sm"
              >
                {critical.map((goal) => {
                  const label = goalLabel(goal.goalId)
                  return (
                    <li
                      className="flex items-baseline justify-between gap-2"
                      key={goal.goalId}
                    >
                      <GoalLink goalId={goal.goalId} label={label} />
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {formatEstimateDate(goal.date, locale)}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          ) : null}
          {excludedGoals.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3
                className="text-sm font-semibold"
                data-testid="insights-completion-excluded"
              >
                {t("goals.insights.completionExcluded", {
                  count: excludedGoals.length,
                })}
              </h3>
              <ul
                aria-label={t("goals.insights.excludedTitle")}
                className="flex flex-col gap-1.5 text-sm"
              >
                {excludedGoals.map((goal) => (
                  <li className="flex flex-col" key={goal.goalId}>
                    <GoalLink
                      goalId={goal.goalId}
                      label={goalLabel(goal.goalId)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {goal.reason === "NotEstimated"
                        ? t("goals.insights.notEstimated")
                        : t(`goals.estimate.blocked.${goal.reason}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
