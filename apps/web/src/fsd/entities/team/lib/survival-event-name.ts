const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const

/**
 * A Survival event's month read off its id (`december-2026` → 2026-12-01T00:00Z), so it is named in
 * the UI language. Null for any other id shape (`crescendo-a`).
 */
export function survivalEventMonthUtc(id: string): number | null {
  const match = /^([a-z]+)-(\d{4})$/.exec(id)
  if (!match) return null
  const month = MONTHS.indexOf(match[1] as (typeof MONTHS)[number])
  return month === -1 ? null : Date.UTC(Number(match[2]), month, 1)
}
