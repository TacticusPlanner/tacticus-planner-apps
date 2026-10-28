import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { homeScreenEventBanner } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { formatEventCountdown } from "@/shared/lib"

import type { HomeEventRow } from "../../model/select-home-events"
import type { HomeEventsState } from "../../model/use-home-events"
import { CountdownChip, HomeEventVisual } from "../events/home-event-visual"
import { LegendaryEventPlanButton } from "../events/legendary-event-plan-button"
import { useHomeEventName } from "../events/use-home-event-name"
import { TokenAvailability } from "../token-availability/token-availability"

/** Home's first card: token status and whatever event is live, the two things a glance at Home is
 *  for. Upcoming events live in their own card further down. */
export function RightNow({ events }: { events: HomeEventsState }) {
  const { t } = useTranslation("common")

  return (
    <Card data-testid="home-right-now">
      <CardHeader>
        <CardTitle>{t("home.rightNow.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <TokenAvailability />
        <LiveEvents events={events} />
      </CardContent>
    </Card>
  )
}

function LiveEvents({ events }: { events: HomeEventsState }) {
  const { t } = useTranslation("common")

  if (events.status === "loading") {
    return (
      <div
        className="grid gap-2 sm:grid-cols-2"
        data-testid="home-live-loading"
      >
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }
  // Read failures are reported once, in Upcoming events.
  if (events.status === "error" || events.live.length === 0) {
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
    <ul className="grid gap-2 sm:grid-cols-2" data-testid="home-live-events">
      {events.live.map((row) => (
        <li key={row.key}>
          <LiveEventTile nowMs={events.nowMs} row={row} />
        </li>
      ))}
    </ul>
  )
}

function LiveEventTile({ row, nowMs }: { row: HomeEventRow; nowMs: number }) {
  const { t, i18n } = useTranslation("common")
  const eventName = useHomeEventName()
  const banner =
    row.type === "homeScreen"
      ? homeScreenEventBanner(row.definitionId, row.parameters)
      : undefined
  const endsIn = t("home.events.endsIn", {
    when: formatEventCountdown(row.endMs, nowMs, i18n.language),
  })

  return (
    <div
      className={cn(
        "relative flex h-full min-h-24 items-center gap-2 overflow-hidden rounded-xl border p-3",
        banner && "border-transparent text-white"
      )}
      data-testid="home-live-event"
      data-type={row.type}
    >
      {banner ? (
        <>
          <img
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            src={banner}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-r from-black/90 via-black/70 to-black/35"
          />
        </>
      ) : null}
      <Link
        className="relative flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        data-testid="home-events-row"
        to={row.destination}
      >
        <HomeEventVisual className="size-12" row={row} />
        <span className="min-w-0 space-y-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            {eventName(row)}
            <Badge data-testid="home-events-live-badge">
              {t("home.events.live")}
            </Badge>
          </span>
          {row.type === "legendaryEvent" && row.points !== undefined ? (
            <span
              className="flex flex-wrap gap-x-3 text-sm"
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
        </span>
      </Link>
      <div className="relative flex shrink-0 flex-col items-end gap-2">
        <CountdownChip text={endsIn} />
        {row.type === "legendaryEvent" ? (
          <LegendaryEventPlanButton eventId={row.unitId} />
        ) : null}
      </div>
    </div>
  )
}
