import { useTranslation } from "react-i18next"

import {
  ResourceIconWithTooltip,
  type DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import { EntityIcon } from "@/shared/ui"

import { TodayCard } from "./today-card"
import type { TodayView } from "./today-view-model"

/**
 * Every node the player has really raided today, account-wide, as one compact row each: what it
 * drops, where it is, and the attempts used.
 */
export function TodaysAttemptsCard({
  raids,
  view,
}: {
  raids: DailyRaidsReadyViewModel
  view: TodayView
}) {
  const { t } = useTranslation("dailies")

  return (
    <TodayCard
      meta={
        view.attempts.rows > 0
          ? t("todaysAttempts.meta", {
              count: view.attempts.rows,
              attempts: view.attempts.total,
            })
          : undefined
      }
      testId="todays-attempts"
      title={t("todaysAttempts.title")}
    >
      {raids.todaysAttempts.length > 0 ? (
        <ul data-testid="todays-attempts-list">
          {raids.todaysAttempts.map(({ battleId, attemptsUsed }) => {
            const location = raids.locationsByBattleId.get(battleId)
            // A node this project's plan names keeps the resource it is farmed for; every other node
            // falls back to the catalog's own node → drop index (tacticus-planner-apps#121).
            const resource =
              view.planResourceByBattle.get(battleId) ??
              raids.resourceByBattleId.get(battleId)
            const campaign = location?.campaignName ?? battleId
            const count = t("todaysAttempts.count", { count: attemptsUsed })
            return (
              <li
                key={battleId}
                aria-label={t("todaysAttempts.rowLabel", {
                  material: resource?.label ?? "",
                  campaign,
                  node: location?.nodeLabel ?? "",
                  attempts: count,
                })}
                className="flex min-h-9 items-center gap-2 border-t py-1.5 first:border-t-0"
                data-testid={`todays-attempt-${battleId}`}
              >
                {resource ? (
                  <ResourceIconWithTooltip
                    className="size-6"
                    label={resource.label}
                    visual={resource.visual}
                  />
                ) : (
                  // A node the catalog has no drop for at all (e.g. a dataset gap) still keeps its
                  // leading slot, so the campaign icon and text stay aligned down the whole list.
                  <span aria-hidden className="size-6 shrink-0" />
                )}
                {location?.icon ? (
                  <EntityIcon
                    alt=""
                    className="size-3.5 shrink-0"
                    src={location.icon}
                  />
                ) : null}
                <span className="min-w-0 flex-1 text-sm break-words">
                  <span className="font-medium">{campaign}</span>
                  {location?.nodeLabel ? (
                    <>
                      {" "}
                      <span className="text-muted-foreground">
                        {location.nodeLabel}
                      </span>
                    </>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {count}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("todaysAttempts.empty")}
        </p>
      )}
    </TodayCard>
  )
}
