import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { useEffect, useState } from "react"

import { useMinuteNow } from "@/entities/legendary-event"
import { formatEventCountdown } from "@/shared/lib"
import { CountdownChip } from "@/shared/ui"

import {
  homeRememberedCounts,
  rememberCount,
  rememberedCount,
} from "../../model/remembered-count"
import type { HomeEventRow } from "../../model/select-home-events"
import type { HomeEventsState } from "../../model/use-home-events"
import { HomeEventTile } from "../events/home-event-tile"
import { LegendaryEventPlanButton } from "../events/legendary-event-plan-button"
import { TokenAvailability } from "../token-availability/token-availability"
import { BetaPromoTile } from "./beta-promo-tile"

/** Home's first card: token status and whatever event is live, the two things a glance at Home is
 *  for. Upcoming events live in their own card further down. */
export function RightNow({ events }: { events: HomeEventsState }) {
  const { t } = useTranslation("common")

  return (
    <Card data-testid="home-right-now" id="home-right-now">
      <CardHeader>
        <CardTitle>{t("home.rightNow.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 lg:items-center">
        <BetaPromoTile />
        <TokenAvailability />
        <LiveEvents events={events} />
      </CardContent>
    </Card>
  )
}

function LiveEvents({ events }: { events: HomeEventsState }) {
  const { t } = useTranslation("common")
  const minuteNowMs = useMinuteNow()
  // As many placeholders as were live last time, so the list doesn't grow or shrink on arrival.
  const [placeholders] = useState(() =>
    rememberedCount(homeRememberedCounts.liveEvents)
  )
  const liveCount = events.status === "ready" ? events.live.length : null
  useEffect(() => {
    if (liveCount !== null) {
      rememberCount(homeRememberedCounts.liveEvents, liveCount)
    }
  }, [liveCount])

  if (events.status === "loading") {
    if (placeholders === 0) {
      return (
        <Skeleton
          className="h-5 w-40 self-center rounded-md"
          data-testid="home-live-loading"
        />
      )
    }
    return (
      <div className="grid grid-cols-2 gap-2" data-testid="home-live-loading">
        {Array.from({ length: placeholders }, (_, index) => (
          <Skeleton className="h-12 w-full rounded-xl" key={index} />
        ))}
      </div>
    )
  }
  const live = events.status === "ready" ? events.live : []
  const nowMs = events.status === "ready" ? events.nowMs : minuteNowMs
  // Read failures are reported once, in Upcoming events.
  if (live.length === 0) {
    return (
      <p
        className="self-center text-sm text-muted-foreground"
        data-testid="home-live-none"
      >
        {t("home.rightNow.nothingLive")}
      </p>
    )
  }

  return (
    // Two columns at every width: the tiles are small enough for a phone, and on desktop three rows
    // end about level with the token rings beside them. Dense, so a full-width Legendary Event tile
    // leaves no hole; the list's own order (soonest end first) is what screen readers follow.
    <ul
      className="grid grid-flow-row-dense grid-cols-2 gap-2"
      data-testid="home-live-events"
    >
      {live.map((row) => (
        <li
          className={cn(row.type === "legendaryEvent" && "col-span-2")}
          key={row.key}
        >
          <LiveEventTile nowMs={nowMs} row={row} />
        </li>
      ))}
    </ul>
  )
}

/** A live event as a compact tile: its name, then how long it has left. Everything here is live,
 *  so there is no Live marker. A Legendary Event adds its synced run and points and its plan
 *  action, and spans the grid's two columns to fit them. */
function LiveEventTile({ row, nowMs }: { row: HomeEventRow; nowMs: number }) {
  const { t, i18n } = useTranslation("common")
  const countdown = (narrow: boolean) =>
    formatEventCountdown(row.endMs, nowMs, i18n.language, {
      withHours: true,
      narrow,
    })
  // A projected Campaign Event end is the catalog's guess, not the game's: no countdown, as on Today.
  const endUnconfirmed = row.type === "campaignEvent" && !row.endConfirmed
  const isLegendary = row.type === "legendaryEvent"

  return (
    <HomeEventTile
      action={
        isLegendary ? (
          <LegendaryEventPlanButton eventId={row.unitId} />
        ) : undefined
      }
      className="h-full"
      compact
      data-testid="home-live-event"
      details={
        <>
          {endUnconfirmed ? (
            <span
              className="whitespace-nowrap"
              data-testid="home-events-end-unconfirmed"
            >
              {t("home.events.endUnconfirmed")}
            </span>
          ) : (
            <CountdownChip
              srText={t("home.events.endsIn", { when: countdown(false) })}
              text={countdown(true)}
            />
          )}
          {isLegendary && row.points !== undefined ? (
            <span
              className="flex flex-wrap gap-x-2"
              data-testid="home-events-synced"
            >
              {row.runNumber === null || row.runNumber === undefined ? null : (
                <span>{t("home.events.run", { run: row.runNumber })}</span>
              )}
              <span>
                {t("home.events.points", {
                  points: new Intl.NumberFormat(i18n.language).format(
                    row.points
                  ),
                })}
              </span>
            </span>
          ) : null}
        </>
      }
      row={row}
    />
  )
}
