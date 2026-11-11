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

import { FarmUnlockPaths } from "../shared/farm-unlock-paths"
import { GoalResourceIcon } from "../shared/goal-resource-icon"
import { GoalLink } from "./insights-goal-link"
import { useGoalLabel, type InsightsGoalInfo } from "./insights-view"

/** "What's holding you back": what no farming clears (blockers, with where each unlocks and the goals
 *  they stop), then the farmable resources that take the most energy, each with the goals waiting on
 *  it. Materials show their icon and goals their unit's portrait and goal-type icon. */
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
  const goalLabel = useGoalLabel(goalInfoById)
  // "No node drops it" is the usual reason: said once for the section, not on every row.
  const allNoFarmLocation = blockers.every(
    (blocker) => blocker.reason === "NoFarmLocation"
  )

  const goalChips = (goalIds: readonly string[], label: string) => (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {goalIds.map((goalId) => (
        <li className="min-w-0" key={goalId}>
          <GoalLink
            goalId={goalId}
            info={goalInfoById.get(goalId)}
            label={goalLabel(goalId)}
          />
        </li>
      ))}
    </ul>
  )

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
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-destructive">
                {t("goals.insights.blockersTitle")}
              </h3>
              {allNoFarmLocation ? (
                <p className="text-xs text-muted-foreground">
                  {t("goals.estimate.blocked.NoFarmLocation")}
                </p>
              ) : null}
            </div>
            <ul
              aria-label={t("goals.insights.blockersTitle")}
              className="flex flex-col divide-y text-sm"
            >
              {blockers.map((blocker) => (
                <li
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                  data-testid="insights-blocker"
                  key={blocker.key}
                >
                  {blocker.resourceId ? (
                    <GoalResourceIcon
                      className="size-10"
                      resourceId={blocker.resourceId}
                    />
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {blocker.label ? (
                          <>
                            {blocker.label}
                            <span className="text-muted-foreground tabular-nums">
                              {" "}
                              ×{fmt(blocker.remaining)}
                            </span>
                          </>
                        ) : (
                          t("goals.insights.blockerGoals", {
                            count: blocker.goalIds.length,
                          })
                        )}
                      </span>
                      {allNoFarmLocation ? null : (
                        <span className="text-xs text-muted-foreground">
                          {t(`goals.estimate.blocked.${blocker.reason}`)}
                        </span>
                      )}
                    </div>
                    {blocker.reason === "NoFarmLocation" &&
                    blocker.resourceId ? (
                      <div className="text-xs">
                        <FarmUnlockPaths
                          resourceId={blocker.resourceId}
                          testId="insights-blocker-unlock-paths"
                        />
                      </div>
                    ) : null}
                    {goalChips(
                      blocker.goalIds,
                      t("goals.insights.blockedGoals")
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {bottlenecks.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              {t("goals.insights.bottlenecksTitle")}
            </h3>
            <ol
              aria-label={t("goals.insights.bottlenecksTitle")}
              className="flex flex-col divide-y text-sm"
            >
              {bottlenecks.map((bottleneck) => (
                <li
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                  data-testid="insights-bottleneck"
                  key={bottleneck.id}
                >
                  <GoalResourceIcon
                    className="size-10"
                    resourceId={bottleneck.id}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="min-w-0 font-medium">
                        {bottleneck.label}
                        <span className="text-muted-foreground tabular-nums">
                          {" "}
                          ×{fmt(bottleneck.count)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
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
                    {bottleneck.goalIds.length > 0
                      ? goalChips(
                          bottleneck.goalIds,
                          t("goals.insights.neededFor")
                        )
                      : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}
