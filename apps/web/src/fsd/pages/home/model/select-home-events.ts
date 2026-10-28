import { homeScreenEventInstanceKey } from "@/features/daily-raids"
import {
  deriveLegendaryEventLifecycle,
  type LegendaryEventProgress,
} from "@/entities/legendary-event"

/** The fields the rows read from a Home Screen Event calendar entry. */
export interface HomeScreenEventEntry {
  /** Set on an authored occurrence; with the start it keys the HSE tab's `event` parameter. */
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  /** Occurrence parameters (e.g. a Faction Boost's `targetFactionId`), for its game art. */
  parameters?: Readonly<Record<string, unknown>> | null
}

/** The fields the rows read from a catalog Legendary Event. */
export interface LegendaryEventEntry {
  id: string
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
  | (HomeEventRowBase & {
      type: "homeScreen"
      definitionId: string
      parameters: Readonly<Record<string, unknown>> | null
    })
  | (HomeEventRowBase & {
      type: "legendaryEvent"
      /** The event unit's snowprint id, also the event id. */
      unitId: string
      /** From the sync, for a live event with a synced entry. */
      runNumber?: number | null
      points?: number
    })

/** Upcoming rows on Home, the pinned Legendary Event included. */
const UPCOMING_ROW_LIMIT = 3

export interface HomeEvents {
  /** Running now: the live Home Screen Event, then the live Legendary Event. */
  live: HomeEventRow[]
  /** Not started yet, by start, at most three. */
  upcoming: HomeEventRow[]
}

/**
 * Splits the Home Screen Event selection and the Legendary Event lifecycle into what runs now and
 * what starts next (UTC instants decide; the device timezone only changes the displayed text). The
 * Legendary Event is pinned: when none is live, the next one with a known start always takes an
 * upcoming slot, replacing the latest of the three, so earlier Home Screen Events never push it off
 * Home. Either source may be `null` when its read failed or is pending.
 */
export function selectHomeEvents({
  homeScreen,
  legendary,
  nowMs,
  limit = UPCOMING_ROW_LIMIT,
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
}): HomeEvents {
  const hseRow = (
    entry: HomeScreenEventEntry,
    live: boolean
  ): HomeEventRow => ({
    type: "homeScreen",
    key: `hse:${entry.definitionId}:${entry.startUtc}`,
    definitionId: entry.definitionId,
    parameters: entry.parameters ?? null,
    live,
    startMs: Date.parse(entry.startUtc),
    endMs: Date.parse(entry.endUtc),
    // Opens the HSE tab on this instance, not on whatever it shows by default.
    destination: `/dailies/hse?event=${encodeURIComponent(homeScreenEventInstanceKey(entry))}`,
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
      destination: `/legendary-events/${event.id}`,
      ...(synced
        ? { runNumber: synced.currentEventRun, points: synced.currentPoints }
        : {}),
    }
    if (isLive) live.push(row)
    else upcoming.push(row)
  }

  upcoming.sort((a, b) => a.startMs - b.startMs)
  const shown = upcoming.slice(0, limit)
  const hasLiveLegendary = live.some((row) => row.type === "legendaryEvent")
  const nextLegendary = upcoming.find((row) => row.type === "legendaryEvent")
  if (
    !hasLiveLegendary &&
    nextLegendary &&
    !shown.includes(nextLegendary) &&
    limit > 0
  ) {
    // Every shown row starts before it, so it stays last in start order.
    shown.splice(limit - 1, 1, nextLegendary)
  }

  return { live, upcoming: shown }
}
