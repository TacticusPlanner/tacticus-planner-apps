import {
  homeScreenEventRaidRule,
  type HseRaidRule,
} from "./home-screen-event-rules"

/** What the selection reads of a calendar entry (`EventsCalendarStorageModel` satisfies it). */
export type HomeScreenEventEntry = {
  /** Set on an authored occurrence; null (or absent) on a projected placeholder. */
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  /** Per-occurrence parameters, e.g. Faction Boost's `targetFactionId`. */
  parameters?: Record<string, unknown> | null
}

/** What the selection reads of an event definition: its type and its served `config` (`config.hse`). */
type DefinitionTypes = ReadonlyMap<string, { type: string; config?: unknown }>

/** The raid-point rule of a calendar entry, from its definition's served `config.hse`. */
export function homeScreenEventEntryRule(
  entry: HomeScreenEventEntry,
  definitionsById: DefinitionTypes
): HseRaidRule | null {
  return homeScreenEventRaidRule(
    definitionsById.get(entry.definitionId)?.config,
    entry.parameters
  )
}

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

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
  const hasRule = (entry: TEntry) =>
    Number(homeScreenEventEntryRule(entry, definitionsById) !== null)
  const active = events
    .filter(
      (entry) =>
        Date.parse(entry.startUtc) <= nowMs && nowMs < Date.parse(entry.endUtc)
    )
    .sort(
      (a, b) =>
        hasRule(b) - hasRule(a) ||
        Date.parse(b.startUtc) - Date.parse(a.startUtc) ||
        compareIds(a.definitionId, b.definitionId)
    )[0]
  const upcoming = events
    .filter((entry) => Date.parse(entry.startUtc) > nowMs)
    .sort(
      (a, b) =>
        Date.parse(a.startUtc) - Date.parse(b.startUtc) ||
        compareIds(a.definitionId, b.definitionId)
    )
  return { active: active ?? null, next: upcoming[0] ?? null, upcoming }
}

type HomeScreenEventStatus = "running" | "upcoming" | "past"

/** One Home Screen Event occurrence the HSE tab can show, with its status at the selection instant. */
export type HomeScreenEventInstance<TEntry extends HomeScreenEventEntry> = {
  /** Stable, opaque id carried in the HSE tab's `event` URL parameter. */
  key: string
  entry: TEntry
  status: HomeScreenEventStatus
  /** The raid-point rule from the definition's served `config.hse`, or null when it earns none. */
  raidRule: HseRaidRule | null
}

/**
 * An instance's key: the authored occurrence id, else `definitionId@startUtc` for a projected
 * placeholder (which has no id of its own but is unique by definition and start).
 */
export function homeScreenEventInstanceKey(
  entry: HomeScreenEventEntry
): string {
  return entry.occurrenceId ?? `${entry.definitionId}@${entry.startUtc}`
}

function statusAt(entry: HomeScreenEventEntry, nowMs: number) {
  if (nowMs < Date.parse(entry.startUtc)) return "upcoming"
  return nowMs < Date.parse(entry.endUtc) ? "running" : "past"
}

/**
 * Every Home Screen Event instance in the calendar entries, keyed and given a status at `nowMs`
 * (start inclusive, end exclusive), ordered by start ascending then definition id. This one list
 * backs the HSE switcher, its Previous / Next steps and the tab's resolution of the URL selection.
 * Duplicate keys (a multi-day entry repeated per calendar date) are kept once.
 */
export function listHomeScreenEventInstances<
  TEntry extends HomeScreenEventEntry,
>(
  entries: readonly TEntry[],
  definitionsById: DefinitionTypes,
  nowMs: number
): HomeScreenEventInstance<TEntry>[] {
  const byKey = new Map<string, HomeScreenEventInstance<TEntry>>()
  for (const entry of entries) {
    if (definitionsById.get(entry.definitionId)?.type !== "HomeScreenEvent")
      continue
    const key = homeScreenEventInstanceKey(entry)
    if (!byKey.has(key))
      byKey.set(key, {
        key,
        entry,
        status: statusAt(entry, nowMs),
        raidRule: homeScreenEventEntryRule(entry, definitionsById),
      })
  }
  return [...byKey.values()].sort(
    (a, b) =>
      Date.parse(a.entry.startUtc) - Date.parse(b.entry.startUtc) ||
      compareIds(a.entry.definitionId, b.entry.definitionId)
  )
}

export type HomeScreenEventListTarget<TEntry> = {
  entry: TEntry
  /** True when the event is running; false when the lists are a preview of an upcoming one. */
  live: boolean
  rule: HseRaidRule
}

/**
 * What the Dailies > HSE lists are computed for, given the shown instance: a running or upcoming
 * instance with a raid-point rule (live, or a labelled preview). A past instance, an instance
 * without a rule, or none yields no lists (the status line says why).
 */
export function selectListTarget<TEntry extends HomeScreenEventEntry>(
  instance: HomeScreenEventInstance<TEntry> | null
): HomeScreenEventListTarget<TEntry> | null {
  if (!instance || instance.status === "past") return null
  if (!instance.raidRule) return null
  return {
    entry: instance.entry,
    live: instance.status === "running",
    rule: instance.raidRule,
  }
}

export type HomeScreenEventSelectionResult<
  TEntry extends HomeScreenEventEntry,
> = {
  /** The instance the tab shows, or null when nothing is running or upcoming and none is picked. */
  instance: HomeScreenEventInstance<TEntry> | null
  /** The default instance (running by the overlap rule, else next), or null. */
  defaultInstance: HomeScreenEventInstance<TEntry> | null
  /** True when `requestedKey` was given but matches no instance (the caller drops it). */
  stale: boolean
}

/**
 * Resolves the HSE tab's selection: a requested key found in `instances` wins; a missing or unknown
 * key falls back to the default (the running event chosen by the overlap rule, else the next one).
 */
export function resolveHomeScreenEventSelection<
  TEntry extends HomeScreenEventEntry,
>(
  instances: readonly HomeScreenEventInstance<TEntry>[],
  defaults: Pick<HomeScreenEventSelection<TEntry>, "active" | "next">,
  requestedKey: string | null
): HomeScreenEventSelectionResult<TEntry> {
  const defaultEntry = defaults.active ?? defaults.next
  const defaultKey = defaultEntry
    ? homeScreenEventInstanceKey(defaultEntry)
    : null
  const defaultInstance =
    instances.find((instance) => instance.key === defaultKey) ?? null
  if (requestedKey === null)
    return { instance: defaultInstance, defaultInstance, stale: false }
  const requested = instances.find((instance) => instance.key === requestedKey)
  return requested
    ? { instance: requested, defaultInstance, stale: false }
    : { instance: defaultInstance, defaultInstance, stale: true }
}
