import { hasHomeScreenEventRule } from "./home-screen-event-rules"

/** What the selection reads of a calendar entry (`EventsCalendarStorageModel` satisfies it). */
export type HomeScreenEventEntry = {
  definitionId: string
  startUtc: string
  endUtc: string
}

type DefinitionTypes = ReadonlyMap<string, { type: string }>

export type HomeScreenEventSelection<TEntry extends HomeScreenEventEntry> = {
  /** The one running event (see the ranking below), or null when none is. */
  active: TEntry | null
  /** The earliest event that has not started yet, or null when none is scheduled. */
  next: TEntry | null
  /** Every event that has not started yet, ascending by start; `next` is its first entry. */
  upcoming: TEntry[]
}

/**
 * Derives the active and next Home Screen Event from calendar entries. Activity is decided by UTC
 * instants only (start inclusive, end exclusive), so the device timezone never matters. The data
 * model assumes at most one HSE is active; if stale or erroneous data overlaps anyway, a rule-bearing
 * event beats one without, then the latest `startUtc`, then the lowest definition id, so the pick is
 * deterministic and a non-raid-point event can never mask a rule-bearing one. Scores are never summed.
 */
export function selectActiveHomeScreenEvent<
  TEntry extends HomeScreenEventEntry,
>(
  entries: readonly TEntry[],
  definitionsById: DefinitionTypes,
  nowMs: number
): HomeScreenEventSelection<TEntry> {
  const events = entries.filter(
    (entry) =>
      definitionsById.get(entry.definitionId)?.type === "HomeScreenEvent"
  )
  const active = events
    .filter(
      (entry) =>
        Date.parse(entry.startUtc) <= nowMs && nowMs < Date.parse(entry.endUtc)
    )
    .sort(
      (a, b) =>
        Number(hasHomeScreenEventRule(b.definitionId)) -
          Number(hasHomeScreenEventRule(a.definitionId)) ||
        Date.parse(b.startUtc) - Date.parse(a.startUtc) ||
        (a.definitionId < b.definitionId
          ? -1
          : a.definitionId > b.definitionId
            ? 1
            : 0)
    )[0]
  const upcoming = events
    .filter((entry) => Date.parse(entry.startUtc) > nowMs)
    .sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))
  return { active: active ?? null, next: upcoming[0] ?? null, upcoming }
}

export type HomeScreenEventListTarget<TEntry> = {
  entry: TEntry
  /** True when the event is running; false when the lists are a preview of an upcoming one. */
  live: boolean
}

/**
 * The event the Dailies > HSE lists are computed for: the running event, else (as a labelled
 * preview) the next upcoming one, and only when it has a raid-point rule. A running event without a
 * rule, or an upcoming one without, or nothing scheduled, yields no lists (the status line says why).
 */
export function selectHomeScreenEventListTarget<
  TEntry extends HomeScreenEventEntry,
>(
  selection: Pick<HomeScreenEventSelection<TEntry>, "active" | "next">
): HomeScreenEventListTarget<TEntry> | null {
  const live = selection.active !== null
  const entry = selection.active ?? selection.next
  return entry && hasHomeScreenEventRule(entry.definitionId)
    ? { entry, live }
    : null
}
