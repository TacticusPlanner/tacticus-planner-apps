/**
 * Formats a farming estimate's completion date (an ISO `yyyy-mm-dd` string produced in UTC by
 * `estimate.ts`'s `formatDate`) as a locale-aware short date, e.g. "Oct 11".
 *
 * The date's components are parsed explicitly through `Date.UTC` rather than handing the string to
 * `new Date(...)`: the value names a calendar day, not an instant, and letting the formatter apply
 * the viewer's local time zone rolls that day back by one for anyone west of UTC. The formatter is
 * pinned to UTC for the same reason.
 *
 * Lives in `shared` rather than beside its first caller because both the Goals list (a page) and
 * the project row (a feature) render this same value, and a feature may not import from a page.
 *
 * Returns null for a value that is not a well-formed `yyyy-mm-dd` date, so callers can fall back to
 * their own empty-state copy rather than rendering "Invalid Date".
 */
export function formatEstimateDate(
  isoDate: string | null | undefined,
  locale: string
): string | null {
  if (!isoDate) return null

  const [year, month, day] = isoDate.split("-").map(Number)
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
}
