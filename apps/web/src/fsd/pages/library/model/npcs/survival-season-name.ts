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
]

/**
 * A Survival season's name read off its id (`survival_december_2026` → "December 2026" in the UI
 * language), for a season the translations don't name yet. `undefined` for any other id shape.
 */
export function survivalSeasonName(
  groupId: string,
  language: string
): string | undefined {
  const match = /^survival_([a-z]+)_(\d{4})$/i.exec(groupId)
  if (!match) return undefined
  const month = MONTHS.indexOf(match[1]?.toLowerCase() ?? "")
  if (month === -1) return undefined
  return new Intl.DateTimeFormat(language, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(Date.UTC(Number(match[2]), month, 1))
}
