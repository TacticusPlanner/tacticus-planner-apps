import type { LegendaryEventLifecycle } from "@/entities/legendary-event"
import {
  dateTimeFormat,
  formatEventCountdown,
  formatShortDate,
} from "@/shared/lib"

export interface EventTimingText {
  /** The local date, with the time of day unless the caller drops it. */
  date: string
  inKey: "hub.endsIn" | "hub.startsIn"
  /** Date and countdown on one line: "Starts Dec 13 · in 25 days". */
  lineKey: "hub.endsLine" | "hub.startsLine"
  when: string
}

/** The local date and time of an instant in the device timezone (event windows stay UTC). */
function formatLocalDateTime(epochMs: number, dateLocale: string): string {
  return dateTimeFormat(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(epochMs)
}

/** The timing lines for an event: run end for an active one, next run start for an upcoming one,
 *  nothing for an archived one. */
export function eventTiming(
  lifecycle: LegendaryEventLifecycle,
  nowMs: number,
  locale: string,
  /** Locale for the date stamp (see `useDateLocale`); `locale` words the countdown. */
  dateLocale: string = locale,
  /** False shows the date without the time of day (the hub cards). */
  withTime = true
): EventTimingText | undefined {
  if (lifecycle.runStartMs === undefined) return undefined
  const active = lifecycle.state === "active"
  const targetMs = active ? lifecycle.runEndMs : lifecycle.runStartMs
  return {
    date: withTime
      ? formatLocalDateTime(targetMs, dateLocale)
      : formatShortDate(targetMs, dateLocale, nowMs),
    inKey: active ? "hub.endsIn" : "hub.startsIn",
    lineKey: active ? "hub.endsLine" : "hub.startsLine",
    when: formatEventCountdown(targetMs, nowMs, locale),
  }
}
