import {
  deriveLegendaryEventLifecycle,
  type LegendaryEventProgress,
} from "@/entities/legendary-event"

/** The fields the rows read from a Home Screen Event calendar entry. */
export interface HomeScreenEventEntry {
  definitionId: string
  startUtc: string
  endUtc: string
}

/** The fields the rows read from a catalog Legendary Event. */
export interface LegendaryEventEntry {
  id: string
  finished: boolean
  eventStageStartDatesUtc: readonly string[]
}

interface HomeEventRowBase {
  /** Stable React key. */
  key: string
  live: boolean
  startMs: number
  endMs: number
  destination: string
}

export type HomeEventRow =
  | (HomeEventRowBase & { type: "homeScreen"; definitionId: string })
  | (HomeEventRowBase & {
      type: "legendaryEvent"
      /** The event unit's snowprint id, also the event id. */
      unitId: string
      /** From the sync, for a live event with a synced entry. */
      runNumber?: number | null
      points?: number
    })

const HOME_EVENT_ROW_LIMIT = 3

/**
 * Merges the Home Screen Event selection and the Legendary Event lifecycle into one row list: the
 * live Home Screen Event, then the live Legendary Event, then upcoming events of both types by
 * start (UTC instants decide; the device timezone only changes the displayed text), capped at
 * three. Either source may be `null` when its read failed or is pending.
 */
export function selectHomeEventRows({
  homeScreen,
  legendary,
  nowMs,
  limit = HOME_EVENT_ROW_LIMIT,
}: {
  homeScreen: {
    active: HomeScreenEventEntry | null
    upcoming: readonly HomeScreenEventEntry[]
  } | null
  legendary: {
    events: readonly LegendaryEventEntry[]
    progress: readonly LegendaryEventProgress[]
  } | null
  nowMs: number
  limit?: number
}): HomeEventRow[] {
  const hseRow = (
    entry: HomeScreenEventEntry,
    live: boolean
  ): HomeEventRow => ({
    type: "homeScreen",
    key: `hse:${entry.definitionId}:${entry.startUtc}`,
    definitionId: entry.definitionId,
    live,
    startMs: Date.parse(entry.startUtc),
    endMs: Date.parse(entry.endUtc),
    destination: "/dailies/hse",
  })

  const live: HomeEventRow[] = []
  const upcoming: HomeEventRow[] = []
  if (homeScreen?.active) live.push(hseRow(homeScreen.active, true))
  for (const entry of homeScreen?.upcoming ?? []) {
    upcoming.push(hseRow(entry, false))
  }

  for (const event of legendary?.events ?? []) {
    const lifecycle = deriveLegendaryEventLifecycle(event, nowMs)
    if (lifecycle.runStartMs === undefined) continue // archived, or upcoming with the date TBA
    const isLive = lifecycle.state === "active"
    const synced = isLive
      ? legendary?.progress.find((entry) => entry.id === event.id)
      : undefined
    const row: HomeEventRow = {
      type: "legendaryEvent",
      key: `le:${event.id}:${lifecycle.runStartMs}`,
      unitId: event.id,
      live: isLive,
      startMs: lifecycle.runStartMs,
      endMs: lifecycle.runEndMs,
      destination: `/events/legendary-events/${event.id}`,
      ...(synced
        ? { runNumber: synced.currentEventRun, points: synced.currentPoints }
        : {}),
    }
    if (isLive) live.push(row)
    else upcoming.push(row)
  }

  // The live Home Screen Event was pushed first; a live Legendary Event follows it.
  upcoming.sort((a, b) => a.startMs - b.startMs)
  return [...live, ...upcoming].slice(0, limit)
}
