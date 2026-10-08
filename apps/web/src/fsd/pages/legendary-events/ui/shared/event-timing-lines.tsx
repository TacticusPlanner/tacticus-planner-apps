import { useTranslation } from "react-i18next"

import type { LegendaryEventLifecycle } from "@/entities/legendary-event"

import { eventTiming } from "./event-timing"

/** "Ends in …" / "Starts in …" with the local date and time; nothing for an archived event. */
export function EventTimingLines({
  lifecycle,
  nowMs,
}: {
  lifecycle: LegendaryEventLifecycle
  nowMs: number
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const timing = eventTiming(lifecycle, nowMs, i18n.language)
  if (!timing)
    return lifecycle.state === "upcoming" ? (
      <p className="text-sm text-muted-foreground" data-testid="event-timing">
        {t("hub.startsTba")}
      </p>
    ) : null
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
