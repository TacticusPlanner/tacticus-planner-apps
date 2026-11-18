import { useTranslation } from "react-i18next"

import type { LegendaryEventLifecycle } from "@/entities/legendary-event"

import { useDateLocale } from "@/shared/lib"

import { eventTiming } from "./event-timing"

/** "Ends in …" / "Starts in …" with the local date and time; nothing for an archived event.
 *  `dateOnly` drops the time of day ("Starts Nov 8, 2026"), for a hub card.
 *  `countdownOnly` shows just "Starts in 3 days", for the event page, whose page header already
 *  names the date. */
export function EventTimingLines({
  lifecycle,
  nowMs,
  dateOnly = false,
  countdownOnly = false,
}: {
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  dateOnly?: boolean
  countdownOnly?: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const dateLocale = useDateLocale()
  const timing = eventTiming(
    lifecycle,
    nowMs,
    i18n.language,
    dateLocale,
    !dateOnly
  )
  if (!timing)
    return lifecycle.state === "upcoming" ? (
      <p className="text-sm text-muted-foreground" data-testid="event-timing">
        {t("hub.startsTba")}
      </p>
    ) : null
  if (countdownOnly)
    return (
      <p className="text-sm text-muted-foreground" data-testid="event-timing">
        <span data-testid="event-timing-countdown">
          {t(timing.inKey, { when: timing.when })}
        </span>
      </p>
    )
  return (
    <div className="text-sm text-muted-foreground" data-testid="event-timing">
      <p data-testid="event-timing-countdown">
        {t(timing.inKey, { when: timing.when })}
      </p>
      <p data-testid="event-timing-date">
        {t(timing.atKey, { date: timing.date })}
      </p>
    </div>
  )
}
