import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import {
  useLegendaryEvents,
  useLegendaryEventsProgress,
} from "@/entities/legendary-event"
import { useActiveHomeScreenEvent } from "@/features/daily-raids"
import { eventBarClass, formatEventCountdown } from "@/shared/lib"
import { EventTypeIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import {
  selectHomeEventRows,
  type HomeEventRow,
} from "./select-home-event-rows"

/** Home dashboard's "Events" card: live Home Screen Events and Legendary Events first, then
 *  upcoming ones of both types by start, three rows at most. Distinct from the Events calendar.
 *  Each row is a link to its own destination; the card itself does not navigate. */
export function HomeEventsWidget() {
  const { t } = useTranslation(["common", "events"])
  const homeScreen = useActiveHomeScreenEvent()
  const legendary = useLegendaryEvents()
  const progress = useLegendaryEventsProgress()

  const body = (() => {
    if (homeScreen.status === "loading" || legendary.status === "loading") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-events-loading">
          <span className="sr-only">{t("common:home.events.loading")}</span>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      )
    }
    if (homeScreen.status === "error" && legendary.status === "error") {
      return (
        <p className="text-sm text-destructive" data-testid="home-events-error">
          {t("common:home.events.error")}
        </p>
      )
    }

    // One instant for both choosing the rows and their countdowns, so a row is never labelled with
    // a clock it was not selected at.
    const nowMs =
      homeScreen.status === "ready" ? homeScreen.nowMs : legendary.nowMs
    const rows = selectHomeEventRows({
      homeScreen: homeScreen.status === "ready" ? homeScreen : null,
      legendary:
        legendary.status === "ready"
          ? {
              events: legendary.data,
              progress: progress.status === "ready" ? progress.data : [],
            }
          : null,
      nowMs,
    })
    const failedType =
      homeScreen.status === "error"
        ? t("common:home.events.openHse")
        : legendary.status === "error"
          ? t("common:home.events.openLegendaryEvents")
          : undefined

    return (
      <div className="flex flex-col gap-2">
        {failedType ? (
          <p
            className="text-sm text-destructive"
            data-testid="home-events-source-failed"
          >
            {t("common:home.events.sourceFailed", { type: failedType })}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <EmptyBody />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="home-events-list">
            {rows.map((row) => (
              <li key={row.key}>
                <HomeEventRowLink nowMs={nowMs} row={row} />
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
        <CardTitle>{t("common:home.events.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

function EmptyBody() {
  const { t } = useTranslation(["common", "events"])
  const link = "font-medium text-primary underline-offset-4 hover:underline"
  return (
    <div
      className="flex flex-col gap-1 text-sm text-muted-foreground"
      data-testid="home-events-empty"
    >
      <p>{t("common:home.events.empty")}</p>
      <p className="flex flex-wrap gap-x-4">
        <Link className={link} to="/dailies/hse">
          {t("common:home.events.openHse")}
        </Link>
        <Link className={link} to="/legendary-events">
          {t("common:home.events.openLegendaryEvents")}
        </Link>
      </p>
    </div>
  )
}

function HomeEventRowLink({
  nowMs,
  row,
}: {
  nowMs: number
  row: HomeEventRow
}) {
  const { t, i18n } = useTranslation(["common", "events"])
  const unitName = useUnitName()
  const isLegendary = row.type === "legendaryEvent"
  const name = isLegendary
    ? unitName("Character", row.unitId)
    : t(`events:definitions.${row.definitionId}`, {
        defaultValue: row.definitionId,
      })
  const when = formatEventCountdown(
    row.live ? row.endMs : row.startMs,
    nowMs,
    i18n.language
  )

  return (
    <Link
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
      data-live={row.live}
      data-testid="home-events-row"
      data-type={row.type}
      to={row.destination}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          eventBarClass(isLegendary ? "legendary" : "homeScreen")
        )}
      >
        <EventTypeIcon
          className="size-5"
          definitionType={isLegendary ? "LegendaryEvent" : "HomeScreenEvent"}
        />
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {name}
          {row.live ? (
            <Badge data-testid="home-events-live-badge">
              {t("common:home.events.live")}
            </Badge>
          ) : null}
        </span>
        {row.live ? null : (
          <span
            className="block text-sm text-muted-foreground"
            data-testid="home-events-start"
          >
            {new Date(row.startMs).toLocaleString(i18n.language, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        )}
        <span className="block text-sm text-muted-foreground">
          {t(
            row.live
              ? "common:home.events.endsIn"
              : "common:home.events.startsIn",
            { when }
          )}
        </span>
        {isLegendary && row.live && row.points !== undefined ? (
          <span
            className="flex flex-wrap gap-x-3 text-sm"
            data-testid="home-events-synced"
          >
            {row.runNumber === null || row.runNumber === undefined ? null : (
              <span>{t("common:home.events.run", { run: row.runNumber })}</span>
            )}
            <span>
              {t("common:home.events.points", {
                points: new Intl.NumberFormat(i18n.language).format(row.points),
              })}
            </span>
          </span>
        ) : null}
      </span>
    </Link>
  )
}
