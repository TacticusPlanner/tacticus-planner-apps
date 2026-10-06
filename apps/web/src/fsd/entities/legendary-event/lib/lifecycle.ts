import type { LegendaryEventLifecycle } from "../model/types"

/** A run lasts 7 days from its start (V1's `getLegendaryEventDurationMillis`). Isolated so a
 *  catalog-served duration can replace it. */
export const LEGENDARY_EVENT_RUN_DURATION_MS = 7 * 24 * 60 * 60 * 1000

/** The structural fields lifecycle reads from a catalog event. */
export interface LegendaryEventSchedule {
  finished: boolean
  eventStageStartDatesUtc: readonly string[]
}

/**
 * Derives an event's lifecycle at `nowMs` from its run start dates and `finished` flag: `active`
 * when a run window `[start, start + 7d)` contains now; otherwise `upcoming` (earliest future start)
 * when not finished; otherwise `archived`. Unparseable run starts are ignored. The run number is not
 * derived here: the catalog has no run number, so it only ever comes from the synced progress.
 */
export function deriveLegendaryEventLifecycle(
  event: LegendaryEventSchedule,
  nowMs: number
): LegendaryEventLifecycle {
  const starts = event.eventStageStartDatesUtc
    .map((value) => Date.parse(value))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b)

  const activeStart = starts.find(
    (start) => start <= nowMs && nowMs < start + LEGENDARY_EVENT_RUN_DURATION_MS
  )
  if (activeStart !== undefined) {
    return {
      state: "active",
      runStartMs: activeStart,
      runEndMs: activeStart + LEGENDARY_EVENT_RUN_DURATION_MS,
    }
  }

  const nextStart = event.finished
    ? undefined
    : starts.find((start) => start > nowMs)
  if (nextStart !== undefined) {
    return {
      state: "upcoming",
      runStartMs: nextStart,
      runEndMs: nextStart + LEGENDARY_EVENT_RUN_DURATION_MS,
    }
  }

  return { state: "archived" }
}

export interface LegendaryEventHubEntry<TEvent> {
  event: TEvent
  lifecycle: LegendaryEventLifecycle
}

export interface LegendaryEventHubGroups<TEvent> {
  active: LegendaryEventHubEntry<TEvent>[]
  upcoming: LegendaryEventHubEntry<TEvent>[]
  archived: LegendaryEventHubEntry<TEvent>[]
}

/**
 * Groups events for the hub: active (by run start), upcoming (ascending next run start), archived
 * (alphabetical by `nameOf`, which callers pass the localized unit name through).
 */
export function orderLegendaryEventsForHub<
  TEvent extends LegendaryEventSchedule,
>(
  events: readonly TEvent[],
  nowMs: number,
  nameOf: (event: TEvent) => string,
  locale?: string
): LegendaryEventHubGroups<TEvent> {
  const groups: LegendaryEventHubGroups<TEvent> = {
    active: [],
    upcoming: [],
    archived: [],
  }
  for (const event of events) {
    const lifecycle = deriveLegendaryEventLifecycle(event, nowMs)
    groups[lifecycle.state].push({ event, lifecycle })
  }

  const byStart = (
    a: LegendaryEventHubEntry<TEvent>,
    b: LegendaryEventHubEntry<TEvent>
  ) => (a.lifecycle.runStartMs ?? 0) - (b.lifecycle.runStartMs ?? 0)
  groups.active.sort(byStart)
  groups.upcoming.sort(byStart)
  groups.archived.sort((a, b) =>
    nameOf(a.event).localeCompare(nameOf(b.event), locale)
  )
  return groups
}
