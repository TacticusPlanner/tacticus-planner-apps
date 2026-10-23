import type { LegendaryEventLifecycle } from "../model/types"

/** A run lasts 7 days from its start (V1's `getLegendaryEventDurationMillis`). Isolated so a
 *  catalog-served duration can replace it. */
export const LEGENDARY_EVENT_RUN_DURATION_MS = 7 * 24 * 60 * 60 * 1000

/** An event has three runs; run `n` starts at element `n − 1` of `eventStageStartDatesUtc`. */
export const LEGENDARY_EVENT_RUN_COUNT = 3

/** The structural fields lifecycle reads from a catalog event. */
export interface LegendaryEventSchedule {
  eventStageStartDatesUtc: readonly string[]
}

/**
 * Whether every run of the event is over at `nowMs`: all three run starts are announced and
 * parseable, and run 3's 7-day window has passed. The catalog sends no `finished` flag (its hashed
 * payload must not depend on the clock), so every consumer derives it here.
 */
export function isLegendaryEventFinished(
  event: LegendaryEventSchedule,
  nowMs: number
): boolean {
  const starts = event.eventStageStartDatesUtc
    .slice(0, LEGENDARY_EVENT_RUN_COUNT)
    .map((value) => Date.parse(value))
  const lastStart = starts[LEGENDARY_EVENT_RUN_COUNT - 1]
  return (
    lastStart !== undefined &&
    !starts.some((start) => Number.isNaN(start)) &&
    nowMs >= lastStart + LEGENDARY_EVENT_RUN_DURATION_MS
  )
}

/**
 * Derives an event's lifecycle at `nowMs` from its run start dates: `active` when a run window
 * `[start, start + 7d)` contains now; otherwise `archived` when the event is finished
 * (`isLegendaryEventFinished`); otherwise `upcoming` (earliest future start, or no window when no
 * future date is announced yet, i.e. TBA). Unparseable run starts are ignored. The run number is
 * not derived here: `run-resolution.ts` resolves it from the run schedule and the synced run.
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

  if (isLegendaryEventFinished(event, nowMs)) return { state: "archived" }

  const nextStart = starts.find((start) => start > nowMs)
  if (nextStart !== undefined) {
    return {
      state: "upcoming",
      runStartMs: nextStart,
      runEndMs: nextStart + LEGENDARY_EVENT_RUN_DURATION_MS,
    }
  }

  // Unfinished with no future run date: announced event, date TBA.
  return { state: "upcoming" }
}

interface LegendaryEventHubEntry<TEvent> {
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
  ) =>
    (a.lifecycle.runStartMs ?? Number.MAX_SAFE_INTEGER) -
    (b.lifecycle.runStartMs ?? Number.MAX_SAFE_INTEGER)
  groups.active.sort(byStart)
  groups.upcoming.sort(
    (a, b) =>
      byStart(a, b) || nameOf(a.event).localeCompare(nameOf(b.event), locale)
  )
  groups.archived.sort((a, b) =>
    nameOf(a.event).localeCompare(nameOf(b.event), locale)
  )
  return groups
}
