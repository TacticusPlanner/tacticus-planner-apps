import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { formatEventCountdown, getDeviceLocale } from "@/shared/lib"

import type { HomeEventRow } from "../../model/select-home-events"
import type { HomeEventsState } from "../../model/use-home-events"
import { CountdownChip, HomeEventVisual } from "./home-event-visual"
import { LegendaryEventPlanButton } from "./legendary-event-plan-button"
import { useHomeEventName } from "./use-home-event-name"

/** Home's "Upcoming events" card: the next Home Screen Events and Legendary Events by start, three
 *  rows at most, the next Legendary Event always among them unless one is live (then it is in Right
 *  now). Distinct from the Events calendar. Each row links to its own destination. */
export function UpcomingEvents({ events }: { events: HomeEventsState }) {
  const { t } = useTranslation("common")

  const body = (() => {
    if (events.status === "loading") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-events-loading">
          <span className="sr-only">{t("home.events.loading")}</span>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )
    }
    if (events.status === "error") {
      return (
        <p className="text-sm text-destructive" data-testid="home-events-error">
          {t("home.events.error")}
        </p>
      )
    }

    const failedType =
      events.failedSource === "homeScreen"
        ? t("home.events.openHse")
        : events.failedSource === "legendary"
          ? t("home.events.openLegendaryEvents")
          : undefined

    return (
      <div className="flex flex-col gap-2">
        {failedType ? (
          <p
            className="text-sm text-destructive"
            data-testid="home-events-source-failed"
          >
            {t("home.events.sourceFailed", { type: failedType })}
          </p>
        ) : null}
        {events.upcoming.length === 0 ? (
          <EmptyBody />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="home-events-list">
            {events.upcoming.map((row) => (
              <li key={row.key}>
                <UpcomingEventRow nowMs={events.nowMs} row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  })()

  return (
    <Card data-testid="home-events-widget">
      <CardHeader>
        <CardTitle>{t("home.events.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

function EmptyBody() {
  const { t } = useTranslation("common")
  const link = "font-medium text-primary underline-offset-4 hover:underline"
  return (
    <div
      className="flex flex-col gap-1 text-sm text-muted-foreground"
      data-testid="home-events-empty"
    >
      <p>{t("home.events.empty")}</p>
      <p className="flex flex-wrap gap-x-4">
        <Link className={link} to="/dailies/hse">
          {t("home.events.openHse")}
        </Link>
        <Link className={link} to="/legendary-events">
          {t("home.events.openLegendaryEvents")}
        </Link>
      </p>
    </div>
  )
}

function UpcomingEventRow({
  nowMs,
  row,
}: {
  nowMs: number
  row: HomeEventRow
}) {
  const { t, i18n } = useTranslation("common")
  const eventName = useHomeEventName()
  const startsIn = t("home.events.startsIn", {
    when: formatEventCountdown(row.startMs, nowMs, i18n.language, {
      withHours: true,
    }),
  })

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Link
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        data-live={row.live}
        data-testid="home-events-row"
        data-type={row.type}
        to={row.destination}
      >
        <HomeEventVisual className="size-10" row={row} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{eventName(row)}</span>
          <span
            className="block text-sm text-muted-foreground"
            data-testid="home-events-start"
          >
            {new Date(row.startMs).toLocaleString(getDeviceLocale(), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <CountdownChip className="text-muted-foreground" text={startsIn} />
        {row.type === "legendaryEvent" ? (
          <LegendaryEventPlanButton eventId={row.unitId} />
        ) : null}
      </div>
    </div>
  )
}
