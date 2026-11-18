/**
 * The app's one calendar-date format (style guide rule 7.11): short month and day, with the year
 * only when the date is not in the current year, e.g. "Nov 22" or "Jan 3, 2027".
 */
type DateInput = Date | number | string

const toDate = (value: DateInput) =>
  value instanceof Date ? value : new Date(value)

const options = (withYear: boolean): Intl.DateTimeFormatOptions => ({
  month: "short",
  day: "numeric",
  ...(withYear ? { year: "numeric" } : {}),
})

/** "Nov 22", or "Jan 3, 2027" outside the current year. */
export function formatShortDate(
  value: DateInput,
  locale: string,
  nowMs: number = Date.now()
): string {
  const date = toDate(value)
  const thisYear = new Date(nowMs).getFullYear()
  return new Intl.DateTimeFormat(
    locale,
    options(date.getFullYear() !== thisYear)
  ).format(date)
}

/** "Nov 22 – Dec 6", with the year on both ends when either is outside the current year. */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  locale: string,
  nowMs: number = Date.now()
): string {
  const from = toDate(start)
  const to = toDate(end)
  const thisYear = new Date(nowMs).getFullYear()
  const withYear =
    from.getFullYear() !== thisYear || to.getFullYear() !== thisYear
  const format = new Intl.DateTimeFormat(locale, options(withYear))
  return `${format.format(from)} – ${format.format(to)}`
}
