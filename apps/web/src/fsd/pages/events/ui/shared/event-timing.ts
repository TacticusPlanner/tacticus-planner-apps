import type { LegendaryEventLifecycle } from "@/entities/legendary-event"
import { formatEventCountdown } from "@/shared/lib"

export interface EventTimingText {
  /** "Ends …" / "Starts …" with the local date and time; absent for an archived event. */
  atKey: "hub.endsAt" | "hub.startsAt"
  date: string
  inKey: "hub.endsIn" | "hub.startsIn"
  when: string
}

/** The local date and time of an instant in the device timezone (event windows stay UTC). */
function formatLocalDateTime(epochMs: number, locale: string): string {
  return new Date(epochMs).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/** The timing lines for an event: run end for an active one, next run start for an upcoming one,
 *  nothing for an archived one. */
export function eventTiming(
  lifecycle: LegendaryEventLifecycle,
  nowMs: number,
  locale: string
): EventTimingText | undefined {
  if (lifecycle.state === "archived") return undefined
  const active = lifecycle.state === "active"
  const targetMs = active ? lifecycle.runEndMs : lifecycle.runStartMs
  return {
    atKey: active ? "hub.endsAt" : "hub.startsAt",
    date: formatLocalDateTime(targetMs, locale),
    inKey: active ? "hub.endsIn" : "hub.startsIn",
    when: formatEventCountdown(targetMs, nowMs, locale),
  }
}
