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

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Whether `entry` should be considered part of the local window `[windowStartMs, windowEndMs)` — used
 * both for a single calendar day and for the whole visible range, so a sub-24h entry's membership test
 * is identical at every granularity (see below). Multi-day entries use a standard overlap test. Entries
 * lasting a day or less (e.g. the weekly Double XP/Double Gold modifiers, anchored at UTC midnight) are
 * instead attributed only to the window containing their `startUtc` — for any viewer whose UTC offset
 * isn't zero, a UTC-midnight-anchored 24h window can cross local midnight, which would otherwise smear a
 * single-day event across two local day-columns (or, at the whole-range granularity, let an entry whose
 * real local day falls just *before* the visible range sneak in via a few hours of overlap spillover and
 * then fail every per-day membership test, leaving it with no valid day-column to render in).
 */
function entryOccupiesWindow(
  entry: { startUtc: string; endUtc: string },
  windowStartMs: number,
  windowEndMs: number
): boolean {
  const startMs = Date.parse(entry.startUtc)
  const endMs = Date.parse(entry.endUtc)

  if (endMs - startMs <= ONE_DAY_MS) {
    return startMs >= windowStartMs && startMs < windowEndMs
  }

  return startMs < windowEndMs && endMs > windowStartMs
}

/**
 * A Fixed-recurrence definition's ordinal number (season, event number, ...) at `entry`, derived from
 * how many `intervalDays` steps separate its `startUtc` from the definition's own `anchorUtc` plus the
 * definition's known ordinal at that anchor — read from `config[configKey]` (e.g. Battle Pass's
 * `seasonNumberAtAnchor` is 40, Campaign Event's `eventNumberAtAnchor` is 15). Applies to every slot,
 * projected or authored, so the number always shows without needing it re-authored on every occurrence.
 * `configKey` lets the same math back two visually distinct fields (`derivedSeasonNumber` reads "Season
 * N"; `derivedEventNumber` reads as a bare number, "Campaign Event N") without duplicating this logic.
 */
function deriveOrdinalFromAnchor(
  entry: RawEventsCalendarEntry,
  definition: RawEventDefinition | undefined,
  configKey: string
): number | undefined {
  if (!definition || definition.recurrence?.kind !== "Fixed") {
    return undefined
  }

  const { intervalDays, anchorUtc } = definition.recurrence
  if (!intervalDays || !anchorUtc) {
    return undefined
  }

  // anchorUtc's schema only guarantees it's a non-null string, not a parseable date — an invalid value
  // here would otherwise silently propagate as a "Season NaN" suffix instead of just omitting the number.
  const anchorMs = Date.parse(anchorUtc)
  if (!Number.isFinite(anchorMs)) {
    return undefined
  }

  const config = definition.config
  const numberAtAnchor =
    config && typeof config === "object" && configKey in config
      ? (config as Record<string, unknown>)[configKey]
      : undefined
  if (typeof numberAtAnchor !== "number") {
    return undefined
  }

  const intervalMs = intervalDays * 24 * 60 * 60 * 1000
  const slotsSinceAnchor = Math.round(
    (Date.parse(entry.startUtc) - anchorMs) / intervalMs
  )

  return numberAtAnchor + slotsSinceAnchor
}

function toViewModel(
  entry: RawEventsCalendarEntry,
  definitionsById: ReadonlyMap<string, RawEventDefinition>,
  nowMs: number
): EventEntryViewModel {
  const startMs = Date.parse(entry.startUtc)
  const endMs = Date.parse(entry.endUtc)
  const definition = definitionsById.get(entry.definitionId)

  return {
    key: `${entry.occurrenceId ?? "projected"}::${entry.definitionId}::${entry.startUtc}`,
    definitionId: entry.definitionId,
    definitionType: definition?.type,
    occurrenceId: entry.occurrenceId,
    confirmed: entry.confirmed,
    startUtc: entry.startUtc,
    endUtc: entry.endUtc,
    parameters: entry.parameters,
    isActiveNow: startMs <= nowMs && nowMs < endMs,
    derivedSeasonNumber: deriveOrdinalFromAnchor(
      entry,
      definition,
      "seasonNumberAtAnchor"
    ),
    derivedEventNumber: deriveOrdinalFromAnchor(
      entry,
      definition,
      "eventNumberAtAnchor"
    ),
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
    .filter((entry) => entryOccupiesWindow(entry, rangeStartMs, rangeEndMs))
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

    const dayEntries = visible.filter((entry) =>
      entryOccupiesWindow(entry, dayStartMs, dayEndMs)
    )

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

  const positioned: PositionedEventEntry[] = visible
    .map((entry) => {
      let startColumn = 0
      let endColumn = 0

      dateRange.forEach((date, index) => {
        const dayStartMs = date.getTime()
        const dayEndMs = addLocalDays(date, 1).getTime()
        if (entryOccupiesWindow(entry, dayStartMs, dayEndMs)) {
          if (startColumn === 0) {
            startColumn = index + 1
          }
          endColumn = index + 2
        }
      })

      return { ...entry, startColumn, span: endColumn - startColumn }
    })
    // `collectVisibleEntries` and the per-day window test above use the same membership rule, so every
    // visible entry should land on exactly one day-column — this only guards against a degenerate
    // startColumn 0/span 0 (which CSS grid would otherwise silently render at column 1) if that
    // invariant is ever broken by a future change.
    .filter((entry) => entry.span > 0)

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
