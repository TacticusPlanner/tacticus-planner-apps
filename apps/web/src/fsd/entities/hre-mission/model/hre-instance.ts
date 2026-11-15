/** What the HRE selection reads of a calendar entry (`EventsCalendarStorageModel` satisfies it). */
export type HreCalendarEntry = {
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  parameters?: Record<string, unknown> | null
}

export type HreInstance<TEntry extends HreCalendarEntry = HreCalendarEntry> = {
  /** The storage key of the instance: the occurrence id, else `definitionId@startUtc`. */
  key: string
  entry: TEntry
  status: "running" | "upcoming" | "past"
  /** The occurrence's `featuredCharacterId`, or null when it has none. */
  featuredCharacterId: string | null
}

const HRE_DEFINITION_TYPE = "NewCharacterEvent"

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const instanceKey = (entry: HreCalendarEntry) =>
  entry.occurrenceId ?? `${entry.definitionId}@${entry.startUtc}`

function toInstance<TEntry extends HreCalendarEntry>(
  entry: TEntry,
  status: HreInstance["status"]
): HreInstance<TEntry> {
  const featured = entry.parameters?.featuredCharacterId
  return {
    key: instanceKey(entry),
    entry,
    status,
    featuredCharacterId: typeof featured === "string" ? featured : null,
  }
}

/**
 * The HRE the tab shows: the running one (UTC, start inclusive, end exclusive; several resolve to
 * the latest start, then the lowest occurrence key), else the next upcoming one, else none.
 */
export function selectHreInstance<TEntry extends HreCalendarEntry>(
  entries: readonly TEntry[],
  definitionsById: ReadonlyMap<string, { type: string }>,
  nowMs: number
): HreInstance<TEntry> | null {
  const events = entries.filter(
    (entry) =>
      definitionsById.get(entry.definitionId)?.type === HRE_DEFINITION_TYPE
  )
  const running = events
    .filter(
      (entry) =>
        Date.parse(entry.startUtc) <= nowMs && nowMs < Date.parse(entry.endUtc)
    )
    .sort(
      (a, b) =>
        Date.parse(b.startUtc) - Date.parse(a.startUtc) ||
        compareIds(instanceKey(a), instanceKey(b))
    )[0]
  if (running) return toInstance(running, "running")
  const next = events
    .filter((entry) => Date.parse(entry.startUtc) > nowMs)
    .sort(
      (a, b) =>
        Date.parse(a.startUtc) - Date.parse(b.startUtc) ||
        compareIds(instanceKey(a), instanceKey(b))
    )[0]
  return next ? toInstance(next, "upcoming") : null
}

function statusAt(
  entry: HreCalendarEntry,
  nowMs: number
): HreInstance["status"] {
  if (nowMs < Date.parse(entry.startUtc)) return "upcoming"
  return nowMs < Date.parse(entry.endUtc) ? "running" : "past"
}

/**
 * Every Hero Release Event instance in the calendar entries, keyed and given a status at `nowMs`
 * (start inclusive, end exclusive), ordered by start ascending then key. This one list backs the
 * HRE switcher, its Previous / Next steps and the tab's resolution of the URL selection. Duplicate
 * keys (a multi-day entry repeated per calendar date) are kept once.
 */
export function listHreInstances<TEntry extends HreCalendarEntry>(
  entries: readonly TEntry[],
  definitionsById: ReadonlyMap<string, { type: string }>,
  nowMs: number
): HreInstance<TEntry>[] {
  const byKey = new Map<string, HreInstance<TEntry>>()
  for (const entry of entries) {
    if (definitionsById.get(entry.definitionId)?.type !== HRE_DEFINITION_TYPE)
      continue
    const key = instanceKey(entry)
    if (!byKey.has(key))
      byKey.set(key, toInstance(entry, statusAt(entry, nowMs)))
  }
  return [...byKey.values()].sort(
    (a, b) =>
      Date.parse(a.entry.startUtc) - Date.parse(b.entry.startUtc) ||
      compareIds(a.key, b.key)
  )
}

export type HreSelection<TEntry extends HreCalendarEntry> = {
  /** The instance to show: the requested one, else the default. */
  instance: HreInstance<TEntry> | null
  /** The running one, else the next upcoming one (`selectHreInstance`), from the same list. */
  defaultInstance: HreInstance<TEntry> | null
  /** True when a requested key no longer resolves, so the tab drops it from the URL. */
  stale: boolean
}

/** Resolves the HRE tab's URL selection against the instance list, falling back to the default. */
export function resolveHreSelection<TEntry extends HreCalendarEntry>(
  instances: readonly HreInstance<TEntry>[],
  defaultInstance: HreInstance<TEntry> | null,
  requestedKey: string | null
): HreSelection<TEntry> {
  const fallback = defaultInstance
    ? (instances.find((instance) => instance.key === defaultInstance.key) ??
      defaultInstance)
    : null
  if (requestedKey === null)
    return { instance: fallback, defaultInstance: fallback, stale: false }
  const requested = instances.find((instance) => instance.key === requestedKey)
  return requested
    ? { instance: requested, defaultInstance: fallback, stale: false }
    : { instance: fallback, defaultInstance: fallback, stale: true }
}
