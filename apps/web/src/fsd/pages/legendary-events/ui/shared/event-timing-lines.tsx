import { useTranslation } from "react-i18next"

import type { LegendaryEventLifecycle } from "@/entities/legendary-event"

import { useDateLocale } from "@/shared/lib"

import { eventTiming } from "./event-timing"

/** "Ends in …" / "Starts in …" with the local date and time; nothing for an archived event.
 *  `inline` puts both on one line ("Starts in 3 days · Nov 8, 2026, 2:00 AM"), for a header. */
export function EventTimingLines({
  lifecycle,
  nowMs,
  inline = false,
}: {
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  inline?: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const dateLocale = useDateLocale()
  const timing = eventTiming(lifecycle, nowMs, i18n.language, dateLocale)
  if (!timing)
    return lifecycle.state === "upcoming" ? (
      <p className="text-sm text-muted-foreground" data-testid="event-timing">
        {t("hub.startsTba")}
      </p>
    ) : null
  if (inline)
    return (
      <p className="text-sm text-muted-foreground" data-testid="event-timing">
        <span data-testid="event-timing-countdown">
          {t(timing.inKey, { when: timing.when })}
        </span>
        <span aria-hidden="true"> · </span>
        <span data-testid="event-timing-date">{timing.date}</span>
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
