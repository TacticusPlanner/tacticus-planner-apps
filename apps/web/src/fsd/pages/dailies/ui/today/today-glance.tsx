import { useTranslation } from "react-i18next"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { CampaignEventTile } from "../campaign-event-status"
import { GlanceTile } from "./glance-tile"
import type { TodayView } from "./today-view-model"

/**
 * Today at a glance: daily energy used, the planned totals, today's Onslaught tokens and the
 * campaign event. At the energy limit the planned totals no longer describe anything on screen, so
 * the Onslaught tokens take their slot. Every tile but the campaign event waits for the raids.
 */
export function TodayGlance({ view }: { view: TodayView | undefined }) {
  const { t } = useTranslation("dailies")
  const overLimit = view?.energy.overLimit ?? false
  const hasOnslaught = (view?.onslaughtRuns.length ?? 0) > 0
  const hasPlan = (view?.selection.planEntries.length ?? 0) > 0

  const onslaughtTile = view ? (
    <GlanceTile label={t("plan.onslaught")} testId="glance-onslaught">
      {t("today.glance.tokens", { count: view.onslaughtTokens })}
    </GlanceTile>
  ) : null

  return (
    <section aria-label={t("today.glance.label")} data-testid="today-glance">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3.5">
        {view ? (
          <GlanceTile
            className={cn(overLimit && "ring-energy-over/40")}
            label={t(
              overLimit ? "today.glance.energyOver" : "today.energyUsage.label"
            )}
            labelClassName={cn(overLimit && "text-energy-over")}
            testId="energy-usage"
          >
            <span className="flex items-center gap-2">
              <Progress
                aria-label={t("today.energyUsage.label")}
                aria-valuetext={t("today.energyUsage.value", {
                  percent: Math.round(view.energy.percent),
                })}
                className="h-1.5 flex-1"
                data-testid="energy-usage-bar"
                indicatorClassName={
                  overLimit ? "bg-energy-over" : "bg-progress"
                }
                value={Math.min(view.energy.percent, 100)}
              />
              <span aria-hidden="true" className="shrink-0">
                {Math.round(view.energy.percent)}%
              </span>
            </span>
          </GlanceTile>
        ) : null}
        {overLimit ? (
          hasOnslaught ? (
            onslaughtTile
          ) : null
        ) : view && hasPlan ? (
          <GlanceTile label={t("today.glance.planned")} testId="glance-planned">
            {t("today.summary", {
              energy: view.planned.energy,
              raids: view.planned.raids,
            })}
          </GlanceTile>
        ) : null}
        {!overLimit && hasOnslaught ? onslaughtTile : null}
        <CampaignEventTile />
      </dl>
    </section>
  )
}
