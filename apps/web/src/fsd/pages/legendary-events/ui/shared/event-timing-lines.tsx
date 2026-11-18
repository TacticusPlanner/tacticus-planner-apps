import { useTranslation } from "react-i18next"

import type { LegendaryEventLifecycle } from "@/entities/legendary-event"

import { useDateLocale } from "@/shared/lib"

import { eventTiming } from "./event-timing"

/** "Starts Dec 13 · in 25 days" on one line; nothing for an archived event.
 *  `dateOnly` drops the time of day, for a hub card.
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
    <p className="text-sm text-muted-foreground" data-testid="event-timing">
      <span data-testid="event-timing-line">
        {t(timing.lineKey, { date: timing.date, when: timing.when })}
      </span>
    </p>
  )
}
