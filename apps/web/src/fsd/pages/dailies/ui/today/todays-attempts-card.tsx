import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ResourceIconWithTooltip,
  type DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import { TodayCard } from "./today-card"
import { todaysAttemptProgress, type TodayView } from "./today-view-model"

/**
 * Every node the player has really raided today, account-wide, as one compact row each: what it
 * drops, where it is, the attempts used and, when a goal needs the drop, the have/need and whether
 * it is done (the figure Today's plan shows, kept once the node is raided out of the plan).
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
            const progress = todaysAttemptProgress(raids, resource?.resourceId)
            const rowLabel = {
              material: resource?.label ?? "",
              campaign,
              node: location?.nodeLabel ?? "",
              attempts: count,
            }
            return (
              <li
                key={battleId}
                aria-label={
                  progress
                    ? t("todaysAttempts.rowLabelProgress", {
                        ...rowLabel,
                        progress: progress.done
                          ? t("todaysAttempts.progressDone", progress)
                          : t("schedule.progress", progress),
                      })
                    : t("todaysAttempts.rowLabel", rowLabel)
                }
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
                <span className="min-w-0 flex-1 text-sm font-medium wrap-break-word">
                  <CampaignLocationName
                    campaignName={campaign}
                    difficultyLabel={location?.difficultyLabel}
                    nodeLabel={location?.nodeLabel}
                  />
                </span>
                <span className="flex shrink-0 flex-col items-end text-xs whitespace-nowrap tabular-nums">
                  {progress ? (
                    <span
                      className={
                        progress.done
                          ? "inline-flex items-center gap-0.5 font-semibold text-success-foreground"
                          : "font-semibold"
                      }
                      data-done={progress.done || undefined}
                      data-testid={`todays-attempt-${battleId}-progress`}
                    >
                      {progress.done ? (
                        <CheckIcon aria-hidden className="size-3.5" />
                      ) : null}
                      {progress.owned} / {progress.target}
                      {progress.done ? (
                        <span className="sr-only">
                          {t("todaysAttempts.done")}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  <span className="text-muted-foreground">{count}</span>
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
