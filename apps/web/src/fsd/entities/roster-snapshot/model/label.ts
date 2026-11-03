import type { RosterSnapshotSource } from "./types"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** A snapshot's date with the year, e.g. "Nov 3, 2026". */
export function formatSnapshotDate(takenAt: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(takenAt)
  )
}

/** Whether `name` is still the server's default name: the ISO date it was taken. */
export function hasDefaultName(snapshot: { name: string }): boolean {
  return ISO_DATE.test(snapshot.name)
}

/**
 * How a personal snapshot is named in the UI (design D1): an automatic snapshot that still has its
 * default name reads "Auto · <date>", a V1 import "V1 · <name>", any other the name. A renamed
 * automatic snapshot shows its new name; the Auto badge still marks it.
 */
export function snapshotLabel(
  snapshot: { name: string; source: RosterSnapshotSource; takenAt: string },
  locale: string,
  labels: {
    auto: (date: string) => string
    v1Import: (name: string) => string
  }
): string {
  if (snapshot.source === "auto" && hasDefaultName(snapshot)) {
    return labels.auto(formatSnapshotDate(snapshot.takenAt, locale))
  }
  if (snapshot.source === "v1Import") return labels.v1Import(snapshot.name)
  return snapshot.name
}
