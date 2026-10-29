import { useTranslation } from "react-i18next"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { CampaignEventTile } from "../campaign-event-status"
import { GlanceTile } from "./glance-tile"
import type { TodayView } from "./today-view-model"

/**
 * Today at a glance: daily energy used (used / daily energy), today's Onslaught tokens and the
 * campaign event. Every tile but the campaign event waits for the raids.
 * Below 42rem of page content (one dashboard track) the tiles fold into one dense card of rows, so
 * the plan starts higher on a phone.
 */
export function TodayGlance({ view }: { view: TodayView | undefined }) {
  const { t } = useTranslation("dailies")
  const overLimit = view?.energy.overLimit ?? false
  const hasOnslaught = (view?.onslaughtRuns.length ?? 0) > 0

  return (
    <section aria-label={t("today.glance.label")}>
      <dl
        className={cn(
          "grid divide-y rounded-[min(var(--radius-4xl),24px)] bg-card px-4 py-1 text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10",
          "@[42rem]:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] @[42rem]:gap-3.5 @[42rem]:divide-y-0 @[42rem]:rounded-none @[42rem]:bg-transparent @[42rem]:p-0 @[42rem]:shadow-none @[42rem]:ring-0 @[42rem]:dark:ring-0"
        )}
      >
        {view ? (
          <GlanceTile
            // `dark:` too: the card's own `dark:ring-foreground/10` would win over the plain class.
            className={cn(
              overLimit && "ring-energy-over/40 dark:ring-energy-over/40"
            )}
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
              <span className="shrink-0">
                {/* A daily energy of 0 means no limit: there is nothing to show it against. */}
                {view.energy.daily > 0
                  ? t("today.glance.energyValue", {
                      used: Math.round(view.energy.used),
                      daily: view.energy.daily,
                    })
                  : Math.round(view.energy.used)}
              </span>
            </span>
          </GlanceTile>
        ) : null}
        {view && hasOnslaught ? (
          <GlanceTile label={t("plan.onslaught")}>
            {t("today.glance.tokens", { count: view.onslaughtTokens })}
          </GlanceTile>
        ) : null}
        <CampaignEventTile />
      </dl>
    </section>
  )
}
