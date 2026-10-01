import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
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
  selectHomeScreenEventPreview,
  useActiveHomeScreenEvent,
} from "@/features/daily-raids"
import { eventBarClass } from "@/shared/lib"
import { EventTypeIcon } from "@/shared/ui"

import { formatEventCountdown } from "./format-event-countdown"

/** Home dashboard's "Home Screen Events" card: the live HSE first, then upcoming ones, two at most.
 * HSE-only for now (other event types can join the rows later). Distinct from the Events calendar.
 * Activating the card opens the Dailies > HSE tab in every state. */
export function HomeEventsWidget() {
  const { t, i18n } = useTranslation(["common", "events"])
  const navigate = useNavigate()
  const state = useActiveHomeScreenEvent()
  const open = () => void navigate("/dailies/hse")

  const body = (() => {
    if (state.status === "loading") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-events-loading">
          <span className="sr-only">{t("common:home.events.loading")}</span>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      )
    }
    if (state.status === "error") {
      return (
        <p className="text-sm text-destructive" data-testid="home-events-error">
          {t("common:home.events.error")}
        </p>
      )
    }
    const rows = selectHomeScreenEventPreview(state)
    if (rows.length === 0) {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="home-events-empty"
        >
          {t("common:home.events.empty")}
        </p>
      )
    }
    return (
      <ul className="flex flex-col gap-2" data-testid="home-events-list">
        {rows.map(({ entry, live }) => {
          const startMs = Date.parse(entry.startUtc)
          const when = formatEventCountdown(
            Date.parse(live ? entry.endUtc : entry.startUtc),
            state.nowMs,
            i18n.language
          )
          return (
            <li
              className="flex items-start gap-3 rounded-lg border p-2"
              data-live={live}
              data-testid="home-events-row"
              key={entry.definitionId + entry.startUtc}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  eventBarClass("homeScreen")
                )}
              >
                <EventTypeIcon
                  className="size-5"
                  definitionType="HomeScreenEvent"
                />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {t(`events:definitions.${entry.definitionId}`, {
                    defaultValue: entry.definitionId,
                  })}
                  {live ? (
                    <Badge data-testid="home-events-live-badge">
                      {t("common:home.events.live")}
                    </Badge>
                  ) : null}
                </p>
                {live ? null : (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="home-events-start"
                  >
                    {new Date(startMs).toLocaleString(i18n.language, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t(
                    live
                      ? "common:home.events.endsIn"
                      : "common:home.events.startsIn",
                    { when }
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    )
  })()

  return (
    <Card
      className="cursor-pointer"
      data-testid="home-events-widget"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          open()
        }
      }}
    >
      <CardHeader>
        <CardTitle>{t("common:home.events.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
