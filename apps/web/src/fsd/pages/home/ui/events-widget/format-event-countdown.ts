const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const unitText = (
  value: number,
  unit: "day" | "hour" | "minute",
  locale: string
) =>
  new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: unit === "day" ? "long" : "short",
  }).format(value)

/**
 * A coarse, localized span for events that are hours or days away: "5 days" from a day out (rounded, like the HSE tab's "ends in"), else
 * "3 hr 20 min" (or just "20 min"). The caller wraps it ("Starts in {{when}}"), so the phrase reads
 * "in 5 days" / "in 3 hr 20 min". Pure: `nowMs` is passed in, minutes are the finest unit (the card
 * ticks once a minute), and a past or sub-minute span reads as "1 min" rather than a seconds count.
 */
export function formatEventCountdown(
  targetMs: number,
  nowMs: number,
  locale: string
): string {
  const remaining = Math.max(0, targetMs - nowMs)
  if (remaining >= DAY_MS) {
    return unitText(Math.round(remaining / DAY_MS), "day", locale)
  }
  const totalMinutes = Math.max(1, Math.ceil(remaining / MINUTE_MS))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return [
    hours > 0 ? unitText(hours, "hour", locale) : null,
    minutes > 0 ? unitText(minutes, "minute", locale) : null,
  ]
    .filter(Boolean)
    .join(" ")
}
