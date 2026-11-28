const formats = new Map<string, Intl.DateTimeFormat>()

// A format made without a `timeZone` keeps the device zone it was made in. These two dates' offsets
// tell zones apart (summer time included), so a device that changes zone gets fresh formats.
const JANUARY = new Date(2026, 0, 1)
const JULY = new Date(2026, 6, 1)
const deviceZoneKey = () =>
  `${JANUARY.getTimezoneOffset()}/${JULY.getTimezoneOffset()}`

/**
 * The one place the app builds an `Intl.DateTimeFormat` for display (ui-style-guide copy rule 11).
 * Formats are cached by locale, options and device time zone, so callers can ask for one on every
 * render. Pass the date locale (`useDateLocale()`) for calendar dates and clock times, or the UI
 * language for worded names such as a month in an event title. With no locale, the runtime default
 * is used.
 */
export function dateTimeFormat(
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  // JSON keeps an undefined locale apart from "", which the runtime rejects.
  const key = JSON.stringify([
    locale,
    options,
    options?.timeZone ? null : deviceZoneKey(),
  ])
  let format = formats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    formats.set(key, format)
  }
  return format
}
