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
  status: "running" | "upcoming"
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
