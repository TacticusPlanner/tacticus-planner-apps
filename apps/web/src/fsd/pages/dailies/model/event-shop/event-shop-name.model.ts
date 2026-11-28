const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

/** `November2026` → the instant 2026-11-01T00:00Z; null when the key is not an English month and a year. */
export function eventKeyMonthUtc(eventKey: string): number | null {
  const match = /^([A-Z][a-z]+)(\d{4})$/.exec(eventKey)
  if (!match) return null
  const month = MONTHS.indexOf(match[1] as (typeof MONTHS)[number])
  return month === -1 ? null : Date.UTC(Number(match[2]), month, 1)
}
