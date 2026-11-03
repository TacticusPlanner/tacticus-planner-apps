import type { Progression } from "@workspace/game-domain"

import type { CompareSource } from "./use-compare-data"

/** The stars part of a progression ("Legendary:RedFiveStars" → "RedFiveStars"). */
export type ProgressionStarsKey = Progression extends `${string}:${infer Stars}`
  ? Stars
  : never

/** The `progression:stars.*` key of a progression's stars. */
export function progressionStarsKey(
  progression: Progression
): ProgressionStarsKey {
  return progression.slice(progression.indexOf(":") + 1) as ProgressionStarsKey
}

/** A compact signed number for chips: "+260", "−240", "+4.6k". */
export function formatSigned(value: number, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, {
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value)
  return formatted
}

/** A source's date, e.g. "Oct 12, 2026". */
export function formatSourceDate(takenAt: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(takenAt)
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** What a picker shows for a source: the snapshot's name, or "<event> · run <n> · <date>". */
export function sourceLabel(
  source: CompareSource,
  locale: string,
  runRecordLabel: (values: {
    event: string
    run: number
    date: string
  }) => string
): string {
  if (source.kind === "snapshot") {
    // The default name is the ISO date already; any other name gets the date alongside.
    return ISO_DATE.test(source.name)
      ? source.name
      : `${source.name} · ${formatSourceDate(source.takenAt, locale)}`
  }
  return runRecordLabel({
    event: source.eventName,
    run: source.run,
    date: formatSourceDate(source.takenAt, locale),
  })
}
