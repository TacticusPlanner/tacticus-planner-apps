import type { Progression } from "@workspace/game-domain"

import {
  formatSnapshotDate,
  hasDefaultName,
  snapshotLabel,
} from "@/entities/roster-snapshot"

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

/** The copy a source label is built from. */
export interface SourceLabels {
  runRecord: (values: { event: string; run: number; date: string }) => string
  auto: (date: string) => string
  v1Import: (name: string) => string
}

/** What a picker shows for a source: "<event> · run <n> · <date>" for a run record; for a personal
 *  snapshot its label (`snapshotLabel`), with the date alongside unless the label already is one. */
export function sourceLabel(
  source: CompareSource,
  locale: string,
  labels: SourceLabels
): string {
  if (source.kind === "snapshot") {
    const label = snapshotLabel(source, locale, labels)
    // A default-named snapshot's label is its date already.
    return hasDefaultName(source)
      ? label
      : `${label} · ${formatSnapshotDate(source.takenAt, locale)}`
  }
  return labels.runRecord({
    event: source.eventName,
    run: source.run,
    date: formatSnapshotDate(source.takenAt, locale),
  })
}
