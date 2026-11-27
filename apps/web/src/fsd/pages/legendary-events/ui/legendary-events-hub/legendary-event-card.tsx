import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CirclePlay,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { EventTimingLines } from "../shared/event-timing-lines"
import type {
  HubCardRunStatus,
  HubCardViewModel,
} from "./legendary-events-hub.view-model"
import {
  dateTimeFormat,
  formatShortDate,
  useDateLocale,
  numberFormat,
} from "@/shared/lib"

/** The icon and text style that set each run's status apart; past runs are struck through. */
const RUN_STATUS_STYLE: Record<
  HubCardRunStatus,
  { icon: LucideIcon; className: string }
> = {
  past: { icon: CircleCheck, className: "line-through opacity-70" },
  current: { icon: CirclePlay, className: "font-medium text-foreground" },
  upcoming: { icon: CalendarClock, className: "" },
  maybe: { icon: CircleDashed, className: "italic" },
}

/** One hub row: portrait, localized name and timing, every run's date (guessed when not
 *  announced) for an unfinished event, plus the synced run, tokens and points for the active
 *  event. Activating it opens the event page. */
export function LegendaryEventCard({
  card,
  nowMs,
  testId,
}: {
  card: HubCardViewModel
  nowMs: number
  testId?: string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const dateLocale = useDateLocale()
  const number = numberFormat(i18n.language)
  const portrait = characterIcon(card.eventId as UnitId)
  const { synced } = card
  const month = dateTimeFormat(dateLocale, {
    month: "short",
    year: "numeric",
  })

  return (
    <Link
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-xl border bg-card p-3 text-card-foreground transition-colors",
        "border-l-4 border-l-(--event-legendary) interactive-surface",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
      data-state={card.lifecycle.state}
      data-testid={testId ?? "legendary-event-card"}
      to={`/legendary-events/${card.eventId}`}
    >
      {portrait ? (
        <EntityIcon
          size="portrait-sm"
          alt=""
          className="shrink-0 rounded-full object-cover"
          src={portrait}
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-portrait-sm shrink-0 rounded-full bg-muted"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="truncate font-semibold"
          data-testid="legendary-event-name"
        >
          {card.name}
        </p>
        <EventTimingLines dateOnly lifecycle={card.lifecycle} nowMs={nowMs} />
        {card.runs.length > 0 ? (
          <ul
            aria-label={t("hub.runs")}
            className="space-y-0.5 text-xs text-muted-foreground"
            data-testid="legendary-event-runs"
          >
            {card.runs.map(({ run, startMs, guessed, status }) => {
              const { icon: Icon, className } = RUN_STATUS_STYLE[status]
              return (
                <li
                  className="flex items-center gap-1.5"
                  data-guessed={guessed}
                  data-status={status}
                  data-testid={`legendary-event-run-${run}`}
                  key={run}
                >
                  <Icon aria-hidden="true" className="size-icon-sm shrink-0" />
                  <span className="sr-only">
                    {t(`hub.runStatus.${status}`)}
                  </span>
                  <span className={className}>
                    {t("hub.run", {
                      run,
                      date:
                        startMs === null
                          ? t("runDates.unknown")
                          : guessed
                            ? t("runDates.guessed", {
                                date: month.format(startMs),
                              })
                            : formatShortDate(startMs, dateLocale),
                    })}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {synced.kind === "unavailable" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="legendary-event-synced-unavailable"
          >
            {t("hub.syncedUnavailable")}
          </p>
        ) : null}
        {synced.kind === "entry" ? (
          <p
            className="flex flex-wrap gap-x-3 text-sm"
            data-testid="legendary-event-synced"
          >
            {synced.run === null ? null : (
              <span>{t("run", { run: synced.run })}</span>
            )}
            {synced.tokens ? (
              <span>
                {t("tokens", {
                  current: synced.tokens.current,
                  max: synced.tokens.max,
                })}
              </span>
            ) : null}
            <span>{t("points", { points: number.format(synced.points) })}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}
