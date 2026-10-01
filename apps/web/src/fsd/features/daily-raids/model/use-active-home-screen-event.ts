import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import {
  getEventDefinitions,
  getUpcomingEvents,
} from "@workspace/game-catalog/queries"

import { selectActiveHomeScreenEvent } from "./select-active-home-screen-event"

const HORIZON_DAYS = 400
const TICK_MS = 60_000

type Ready = {
  status: "ready"
  active: EventsCalendarStorageModel | null
  next: EventsCalendarStorageModel | null
  /** Every not-yet-started event, ascending by start (`next` is the first). */
  upcoming: EventsCalendarStorageModel[]
  /** The instant the selection was made at, for countdowns (render stays pure). */
  nowMs: number
}

export type ActiveHomeScreenEventState =
  { status: "loading" } | { status: "error" } | Ready

// `useLiveQuery` has no error channel (a rejected querier throws to the error boundary), so the
// querier resolves a tagged result instead, like `use-events-calendar.ts`.
async function load(nowMs: number): Promise<Ready | { status: "error" }> {
  try {
    const [definitions, entries] = await Promise.all([
      getEventDefinitions(),
      getUpcomingEvents(
        new Date(nowMs),
        new Date(nowMs + HORIZON_DAYS * 86_400_000)
      ),
    ])
    const selection = selectActiveHomeScreenEvent(
      entries,
      new Map(definitions.map((definition) => [definition.id, definition])),
      nowMs
    )
    return { status: "ready", ...selection, nowMs }
  } catch {
    return { status: "error" }
  }
}

/** The single active Home Screen Event (and the next one) from the game-events calendar. */
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
