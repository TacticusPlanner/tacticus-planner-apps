import type {
  EventEntryViewModel,
  EventLane,
  EventsCalendarDay,
  PositionedEventEntry,
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

/**
 * Adds `days` local calendar days to `date` via `setDate`, not raw millisecond arithmetic — a local day
 * isn't always exactly 24h (DST spring-forward/fall-back days are 23h/25h), so `+ days * DAY_MS` can land
 * on the wrong side of local midnight and either mis-bucket an entry or make a "week" span 6 or 8 days.
 */
export function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Every calendar date (local) from `rangeStart` (inclusive) to `rangeEnd` (exclusive). */
function buildDateRange(rangeStart: Date, rangeEnd: Date): Date[] {
  const dates: Date[] = []
  let cursor = new Date(rangeStart)

  while (cursor < rangeEnd) {
    dates.push(cursor)
    cursor = addLocalDays(cursor, 1)
  }

  return dates
}

function toViewModel(
  entry: RawEventsCalendarEntry,
  definitionsById: ReadonlyMap<string, RawEventDefinition>,
  nowMs: number
): EventEntryViewModel {
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
}

/**
 * Every raw entry overlapping `[rangeStart, rangeEnd)`, resolved to a view model and sorted by start
 * time — the shared first step behind both `buildEventsCalendarDays` (bucketed per day) and
 * `buildEventsCalendarLanes` (packed into Gantt-style rows), so a day window ⊆ the full range means
 * filtering here first and re-filtering per day below is equivalent to filtering per day directly.
 */
function collectVisibleEntries(
  entries: readonly RawEventsCalendarEntry[],
  definitionsById: ReadonlyMap<string, RawEventDefinition>,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date
): EventEntryViewModel[] {
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  const nowMs = now.getTime()

  return entries
    .filter((entry) => {
      const startMs = Date.parse(entry.startUtc)
      const endMs = Date.parse(entry.endUtc)
      return startMs < rangeEndMs && endMs > rangeStartMs
    })
    .map((entry) => toViewModel(entry, definitionsById, nowMs))
    .sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))
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
  const visible = collectVisibleEntries(
    entries,
    definitionsById,
    rangeStart,
    rangeEnd,
    now
  )

  return buildDateRange(rangeStart, rangeEnd).map((date) => {
    const dayStartMs = date.getTime()
    const dayEndMs = addLocalDays(date, 1).getTime()

    const dayEntries = visible.filter((entry) => {
      const startMs = Date.parse(entry.startUtc)
      const endMs = Date.parse(entry.endUtc)
      return startMs < dayEndMs && endMs > dayStartMs
    })

    return { date: toIsoDate(date), entries: dayEntries }
  })
}

/**
 * The same visible entries as `buildEventsCalendarDays`, but packed into Gantt-style lanes for the
 * desktop grid: each entry gets a `startColumn`/`span` (1-indexed, in day-columns of the visible range)
 * computed via the exact same day-membership test as the day buckets above (so a bar's edges always
 * line up with the day-header columns, including on DST transition days). Lane assignment is greedy —
 * sort by start column then by longest-first, and place each entry in the first lane whose last entry
 * doesn't overlap it, else open a new lane — which keeps same-day entries stacked in as few rows as the
 * overlap structure allows, same as the reference calendars.
 */
export function buildEventsCalendarLanes(
  entries: readonly RawEventsCalendarEntry[],
  definitionsById: ReadonlyMap<string, RawEventDefinition>,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date
): EventLane[] {
  const visible = collectVisibleEntries(
    entries,
    definitionsById,
    rangeStart,
    rangeEnd,
    now
  )
  const dateRange = buildDateRange(rangeStart, rangeEnd)

  const positioned: PositionedEventEntry[] = visible.map((entry) => {
    const startMs = Date.parse(entry.startUtc)
    const endMs = Date.parse(entry.endUtc)

    let startColumn = 0
    let endColumn = 0

    dateRange.forEach((date, index) => {
      const dayStartMs = date.getTime()
      const dayEndMs = addLocalDays(date, 1).getTime()
      if (startMs < dayEndMs && endMs > dayStartMs) {
        if (startColumn === 0) {
          startColumn = index + 1
        }
        endColumn = index + 2
      }
    })

    return { ...entry, startColumn, span: endColumn - startColumn }
  })

  const sortedForPacking = [...positioned].sort(
    (a, b) => a.startColumn - b.startColumn || b.span - a.span
  )

  const lanes: { entries: PositionedEventEntry[]; lastColumn: number }[] = []
  for (const entry of sortedForPacking) {
    const lane = lanes.find(
      (candidate) => candidate.lastColumn <= entry.startColumn
    )
    if (lane) {
      lane.entries.push(entry)
      lane.lastColumn = entry.startColumn + entry.span
    } else {
      lanes.push({
        entries: [entry],
        lastColumn: entry.startColumn + entry.span,
      })
    }
  }

  return lanes.map(({ entries: laneEntries }) => ({ entries: laneEntries }))
}
