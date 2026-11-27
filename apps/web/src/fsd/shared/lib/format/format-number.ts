const formats = new Map<string, Intl.NumberFormat>()

/**
 * The one place the app builds an `Intl.NumberFormat` (ui-style-guide copy rule 11). Formats are
 * cached by locale and options, so callers can ask for one on every render. With no locale, the
 * runtime default is used.
 */
export function numberFormat(
  locale: string | undefined,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = `${locale ?? ""}|${options ? JSON.stringify(options) : ""}`
  let format = formats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, options)
    formats.set(key, format)
  }
  return format
}
