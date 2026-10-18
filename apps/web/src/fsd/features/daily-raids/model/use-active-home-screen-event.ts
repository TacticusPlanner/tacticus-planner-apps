import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import {
  getEventDefinitions,
  getUpcomingEvents,
  hasEventsCalendarSynced,
} from "@workspace/game-catalog/queries"

import {
  listHomeScreenEventInstances,
  selectActiveHomeScreenEvent,
  type HomeScreenEventInstance,
} from "./select-active-home-screen-event"

/** How far back and ahead the calendar is read: past instances stay reachable from the HSE switcher. */
const HORIZON_DAYS = 400
const DAY_MS = 86_400_000
const TICK_MS = 60_000

type Ready = {
  status: "ready"
  active: EventsCalendarStorageModel | null
  next: EventsCalendarStorageModel | null
  /** Every not-yet-started event, ascending by start (`next` is the first). */
  upcoming: EventsCalendarStorageModel[]
  /** Every HSE instance in the horizon (running, upcoming, past), by start then definition id. */
  instances: HomeScreenEventInstance<EventsCalendarStorageModel>[]
  /** The instant the selection was made at, for countdowns (render stays pure). */
  nowMs: number
}

export type ActiveHomeScreenEventState =
  { status: "loading" } | { status: "error" } | Ready

// `useLiveQuery` has no error channel (a rejected querier throws to the error boundary), so the
// querier resolves a tagged result instead, like `use-events-calendar.ts`.
async function load(nowMs: number): Promise<ActiveHomeScreenEventState> {
  try {
    // Before the first calendar sync the tables are empty, not "no events": stay loading so a
    // shared `?event=` key is not judged stale and stripped (the init gate renders pages meanwhile).
    if (!(await hasEventsCalendarSynced())) return { status: "loading" }
    const [definitions, entries] = await Promise.all([
      getEventDefinitions(),
      getUpcomingEvents(
        new Date(nowMs - HORIZON_DAYS * DAY_MS),
        new Date(nowMs + HORIZON_DAYS * DAY_MS)
      ),
    ])
    const definitionsById = new Map(
      definitions.map((definition) => [definition.id, definition])
    )
    const instances = listHomeScreenEventInstances(
      entries,
      definitionsById,
      nowMs
    )
    // The default (running by the overlap rule, else next) is derived from the same instance list.
    const selection = selectActiveHomeScreenEvent(
      instances.map((instance) => instance.entry),
      definitionsById,
      nowMs
    )
    return { status: "ready", ...selection, instances, nowMs }
  } catch {
    return { status: "error" }
  }
}

/** The single active Home Screen Event, the next one, and every HSE instance (past included) from the
 * game-events calendar. */
export function useActiveHomeScreenEvent(): ActiveHomeScreenEventState {
  // A coarse tick re-selects across an event boundary without a reload.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  const result = useLiveQuery(() => load(Date.now()), [tick])
  return result ?? { status: "loading" }
}
