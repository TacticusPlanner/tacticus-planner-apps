/**
 * The app's one calendar-date format (style guide rule 7.11): short month and day, with the year
 * only when the date is not in the current year, e.g. "Nov 22" or "Jan 3, 2027".
 * An invalid date formats as an empty string instead of throwing.
 */
type DateInput = Date | number | string

const toDate = (value: DateInput) =>
  value instanceof Date ? value : new Date(value)

const isValid = (date: Date) => !Number.isNaN(date.getTime())

const options = (withYear: boolean): Intl.DateTimeFormatOptions => ({
  month: "short",
  day: "numeric",
  ...(withYear ? { year: "numeric" } : {}),
})

const formatOrEmpty = (format: Intl.DateTimeFormat, date: Date) =>
  isValid(date) ? format.format(date) : ""

/** "Nov 22", or "Jan 3, 2027" outside the current year. */
export function formatShortDate(
  value: DateInput,
  locale: string,
  nowMs: number = Date.now()
): string {
  const date = toDate(value)
  const thisYear = new Date(nowMs).getFullYear()
  return formatOrEmpty(
    new Intl.DateTimeFormat(locale, options(date.getFullYear() !== thisYear)),
    date
  )
}

/** Both ends of a range with one year decision: the year on both when either is outside the current year. */
export function formatDateRangeParts(
  start: DateInput,
  end: DateInput,
  locale: string,
  nowMs: number = Date.now()
): { start: string; end: string } {
  const from = toDate(start)
  const to = toDate(end)
  const thisYear = new Date(nowMs).getFullYear()
  const outside = (date: Date) =>
    isValid(date) && date.getFullYear() !== thisYear
  const format = new Intl.DateTimeFormat(
    locale,
    options(outside(from) || outside(to))
  )
  return { start: formatOrEmpty(format, from), end: formatOrEmpty(format, to) }
}

/** "Nov 22 – Dec 6", with the year on both ends when either is outside the current year; an invalid end is left out. */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  locale: string,
  nowMs: number = Date.now()
): string {
  const parts = formatDateRangeParts(start, end, locale, nowMs)
  return [parts.start, parts.end].filter(Boolean).join(" – ")
}
