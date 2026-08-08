import type {
  EventEntryViewModel,
  EventsCalendarDay,
  RawEventDefinition,
  RawEventsCalendarEntry,
} from "./events-calendar.types"

// Local-calendar-date formatting (not `.toISOString()`, which converts to UTC first and would mislabel
// the date for any timezone ahead of UTC — e.g. local midnight Aug 9 in UTC+10 is Aug 8 in UTC).
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/** Inverse of `toIsoDate` — parses a "yyyy-MM-dd" date key back into a local-midnight Date. */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Every calendar date (local) from `rangeStart` (inclusive) to `rangeEnd` (exclusive). */
function buildDateRange(rangeStart: Date, rangeEnd: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(rangeStart)

  while (cursor < rangeEnd) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

/**
 * Groups already-fetched, already-deduped calendar entries (see `getUpcomingEvents`) into one
 * day-bucket per visible date, mirroring the backend's own date-membership rule (start inclusive, end
 * exclusive) so a multi-day entry appears under every date it spans in this range, same as
 * `events-calendar`'s own server-side date expansion.
 */
export function buildEventsCalendarDays(
  entries: readonly RawEventsCalendarEntry[],
  definitionsById: ReadonlyMap<string, RawEventDefinition>,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date
): EventsCalendarDay[] {
  const nowMs = now.getTime()

  return buildDateRange(rangeStart, rangeEnd).map((date) => {
    const dayStartMs = date.getTime()
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000

    const dayEntries: EventEntryViewModel[] = entries
      .filter((entry) => {
        const startMs = Date.parse(entry.startUtc)
        const endMs = Date.parse(entry.endUtc)
        return startMs < dayEndMs && endMs > dayStartMs
      })
      .map((entry) => {
        const startMs = Date.parse(entry.startUtc)
        const endMs = Date.parse(entry.endUtc)

        return {
          key: `${entry.occurrenceId ?? "projected"}::${entry.definitionId}::${entry.startUtc}`,
          definitionId: entry.definitionId,
          definitionType: definitionsById.get(entry.definitionId)?.type,
          occurrenceId: entry.occurrenceId,
          confirmed: entry.confirmed,
          startUtc: entry.startUtc,
          endUtc: entry.endUtc,
          parameters: entry.parameters,
          isActiveNow: startMs <= nowMs && nowMs < endMs,
        }
      })
      .sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))

    return { date: toIsoDate(date), entries: dayEntries }
  })
}
