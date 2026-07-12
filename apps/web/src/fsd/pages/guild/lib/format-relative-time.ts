const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
]

/**
 * Formats a past instant (epoch milliseconds) as a locale-aware relative string ("3 hours ago"), matching
 * whichever of the app's supported languages is active instead of hardcoding English. Returns null for a
 * null input so callers can show their own "never" copy.
 */
export function formatRelativeTime(
  epochMs: number | null,
  locale: string
): string | null {
  if (epochMs === null || Number.isNaN(epochMs)) {
    return null
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const diffSeconds = Math.round((Date.now() - epochMs) / 1000)

  if (diffSeconds < 60) {
    return formatter.format(0, "second")
  }

  for (const { unit, seconds } of UNITS) {
    if (diffSeconds >= seconds) {
      return formatter.format(-Math.floor(diffSeconds / seconds), unit)
    }
  }

  return formatter.format(-Math.floor(diffSeconds / 60), "minute")
}
