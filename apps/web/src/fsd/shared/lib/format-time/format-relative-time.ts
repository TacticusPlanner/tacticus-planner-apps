const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
]

/**
 * Formats an instant (epoch milliseconds) as a locale-aware relative string ("3 hours ago", or "in 3
 * hours" for a future instant). Returns null for a null or invalid input so callers can provide their
 * own fallback copy.
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
  const absDiffSeconds = Math.abs(diffSeconds)

  if (absDiffSeconds < 60) {
    return formatter.format(0, "second")
  }

  for (const { unit, seconds } of UNITS) {
    if (absDiffSeconds >= seconds) {
      return formatter.format(-Math.round(diffSeconds / seconds), unit)
    }
  }

  return formatter.format(-Math.round(diffSeconds / 60), "minute")
}
