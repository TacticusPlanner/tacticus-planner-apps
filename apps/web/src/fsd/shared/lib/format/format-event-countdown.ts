import { DAY_MS, HOUR_MS, MINUTE_MS } from "./durations"
import { numberFormat } from "./format-number"

const unitText = (
  value: number,
  unit: "day" | "hour" | "minute",
  locale: string,
  narrow: boolean
) =>
  numberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: narrow ? "narrow" : unit === "day" ? "long" : "short",
  }).format(value)

/**
 * A coarse, localized span for events that are hours or days away: "5 days" from a day out (rounded, like the HSE tab's "ends in"), else
 * "3 hr 20 min" (or just "20 min"). The caller wraps it ("Starts in {{when}}"), so the phrase reads
 * "in 5 days" / "in 3 hr 20 min". Pure: `nowMs` is passed in, minutes are the finest unit (the card
 * ticks once a minute), and a past or sub-minute span reads as "1 min" rather than a seconds count.
 * With `withHours`, a span from a day out keeps its whole hours instead of rounding ("5 days 11 hr").
 * With `narrow`, every unit takes its narrowest form ("5d 11h", "3h 20m").
 */
export function formatEventCountdown(
  targetMs: number,
  nowMs: number,
  locale: string,
  {
    withHours = false,
    narrow = false,
  }: {
    withHours?: boolean
    /** Each unit in its narrowest form ("2d 10h"), for a compact tile. */
    narrow?: boolean
  } = {}
): string {
  const remaining = Math.max(0, targetMs - nowMs)
  if (remaining >= DAY_MS) {
    if (!withHours)
      return unitText(Math.round(remaining / DAY_MS), "day", locale, narrow)
    const days = Math.floor(remaining / DAY_MS)
    const hours = Math.floor((remaining % DAY_MS) / HOUR_MS)
    return [
      unitText(days, "day", locale, narrow),
      hours > 0 ? unitText(hours, "hour", locale, narrow) : null,
    ]
      .filter(Boolean)
      .join(" ")
  }
  const totalMinutes = Math.max(1, Math.ceil(remaining / MINUTE_MS))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return [
    hours > 0 ? unitText(hours, "hour", locale, narrow) : null,
    minutes > 0 ? unitText(minutes, "minute", locale, narrow) : null,
  ]
    .filter(Boolean)
    .join(" ")
}
