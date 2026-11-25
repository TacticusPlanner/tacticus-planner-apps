import { useTranslation } from "react-i18next"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import {
  energyIcon,
  gameMenuIcon,
  onslaughtTokenIcon,
} from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import { CampaignEventTile } from "../campaign-event-status"
import { TODAY_SHOPS_ID } from "../today-shop-recommendations"
import { GlanceTile } from "./glance-tile"
import type { ShopsGlance } from "./shops-glance"
import { TODAY_ONSLAUGHT_ID } from "./today-onslaught-card"
import type { TodayView } from "./today-view-model"

/**
 * Today at a glance: daily energy used (used / daily energy), today's Onslaught tokens, today's shop
 * buys and the campaign event. Energy and Onslaught wait for the raids; Shops for the shop
 * recommendations. Onslaught and Shops link to their cards below.
 * Below 42rem of page content (one dashboard track) the tiles fold into one dense card of rows, so
 * the plan starts higher on a phone.
 */
export function TodayGlance({
  view,
  shops = null,
}: {
  view: TodayView | undefined
  shops?: ShopsGlance
}) {
  const { t } = useTranslation("dailies")
  const overLimit = view?.energy.overLimit ?? false
  const hasOnslaught = (view?.onslaughtRuns.length ?? 0) > 0

  return (
    <section aria-label={t("today.glance.label")}>
      <dl
        className={cn(
          "grid divide-y rounded-[min(var(--radius-4xl),24px)] bg-card px-4 py-1 text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10",
          "@2xl:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] @2xl:gap-3.5 @2xl:divide-y-0 @2xl:rounded-none @2xl:bg-transparent @2xl:p-0 @2xl:shadow-none @2xl:ring-0 @2xl:dark:ring-0"
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
            <span className="flex items-center justify-end gap-2 @2xl:justify-start">
              {/* A daily energy of 0 means no limit: no bar, and no percentage to announce. */}
              {view.energy.daily > 0 ? (
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
              ) : null}
              <span className="flex shrink-0 items-center gap-1">
                <EntityIcon size="icon" alt="" src={energyIcon()} />
                {view.energy.daily > 0
                  ? t("today.glance.energyValue", {
                      used: Math.round(view.energy.used),
                      daily: view.energy.daily,
                    })
                  : Math.round(view.energy.used)}
              </span>
            </span>
          </GlanceTile>
        ) : (
          // Holds the energy row's place while the raids load, so it does not push the campaign
          // event row and the plan below it down when it arrives (layout shift).
          <GlanceTile
            label={t("today.energyUsage.label")}
            testId="energy-usage-loading"
          >
            <Skeleton className="ms-auto h-lh w-20 @2xl:ms-0" />
          </GlanceTile>
        )}
        {view && hasOnslaught ? (
          <GlanceTile
            href={`#${TODAY_ONSLAUGHT_ID}`}
            label={t("plan.onslaught")}
            linkLabel={t("today.glance.tileLink", {
              label: t("plan.onslaught"),
              value: t("today.glance.tokens", { count: view.onslaughtTokens }),
            })}
          >
            <span className="flex items-center justify-end gap-1 @2xl:justify-start">
              <EntityIcon size="icon" alt="" src={onslaughtTokenIcon()} />
              {t("today.glance.tokens", { count: view.onslaughtTokens })}
            </span>
          </GlanceTile>
        ) : null}
        <ShopsTile shops={shops} />
        <CampaignEventTile />
      </dl>
    </section>
  )
}

/** Today's shop buys: guaranteed offers worth buying, with the offers a refresh may bring in muted
 *  text, or "Nothing today", so the row doesn't come and go between days. Hidden without goals. */
function ShopsTile({ shops }: { shops: ShopsGlance }) {
  const { t } = useTranslation("dailies")
  if (shops === null) return null
  const label = t("today.glance.shops")
  if (shops.status === "loading") {
    return (
      <GlanceTile label={label} testId="today-glance-shops-loading">
        <Skeleton className="ms-auto h-lh w-20 @2xl:ms-0" />
      </GlanceTile>
    )
  }
  const value =
    shops.toBuy > 0
      ? t("today.glance.toBuy", { count: shops.toBuy })
      : t("today.glance.nothingToBuy")
  const possible =
    shops.possible > 0
      ? t("today.glance.possible", { count: shops.possible })
      : null
  return (
    <GlanceTile
      href={`#${TODAY_SHOPS_ID}`}
      label={label}
      linkLabel={t("today.glance.tileLink", {
        label,
        value: possible ? `${value} ${possible}` : value,
      })}
      testId="today-glance-shops"
    >
      <span className="flex flex-wrap items-center justify-end gap-x-1.5 @2xl:justify-start">
        <EntityIcon size="icon" alt="" src={gameMenuIcon("shop")} />
        {value}
        {possible ? (
          <span className="text-sm font-normal text-muted-foreground">
            {possible}
          </span>
        ) : null}
      </span>
    </GlanceTile>
  )
}
