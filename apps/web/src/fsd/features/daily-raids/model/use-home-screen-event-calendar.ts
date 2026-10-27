import { useEffect, useMemo, useState } from "react"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import { hasEventsCalendarSynced } from "@workspace/game-catalog/queries"

import { useReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import type { HseRaidRule } from "./home-screen-event-rules"
import {
  listHomeScreenEventInstances,
  selectActiveHomeScreenEvent,
  type HomeScreenEventInstance,
  type HomeScreenEventRuleOf,
} from "./select-active-home-screen-event"

/** How far back and ahead the calendar is read: past instances stay reachable from the HSE switcher. */
const HORIZON_DAYS = 400
const DAY_MS = 86_400_000
const TICK_MS = 60_000

type Ready = {
  status: "ready"
  active: EventsCalendarStorageModel | null
  /** The active event's raid-point rule, or null when none is active or it earns no raid points. */
  activeRaidRule: HseRaidRule | null
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

/** Calendar rows whose window overlaps the horizon around `nowMs`; a multi-day entry repeats per
 * date and is kept once by `listHomeScreenEventInstances`. */
function entriesInHorizon(
  entries: readonly EventsCalendarStorageModel[],
  nowMs: number
) {
  const startMs = nowMs - HORIZON_DAYS * DAY_MS
  const endMs = nowMs + HORIZON_DAYS * DAY_MS
  return entries.filter(
    (entry) =>
      Date.parse(entry.startUtc) < endMs && Date.parse(entry.endUtc) > startMs
  )
}

/**
 * The single active Home Screen Event, the next one, and every HSE instance (past included) from the
 * game-events calendar. `ruleOf` gives each event its raid-point rule; without it every event reads
 * as earning none (see `useActiveHomeScreenEvent`, which passes the real lookup).
 */
export function useHomeScreenEventCalendar(
  ruleOf?: HomeScreenEventRuleOf
): ActiveHomeScreenEventState {
  // A coarse tick re-selects from the cached calendar across an event boundary without a reload.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  const synced = useReadState(
    "events-calendar-synced",
    hasEventsCalendarSynced,
    []
  )
  const definitions = useCatalogDataset("event-definitions", toById)
  const calendar = useCatalogDataset("events-calendar")

  return useMemo((): ActiveHomeScreenEventState => {
    const reads = [synced, definitions, calendar]
    if (reads.some((read) => read.status === "error"))
      return { status: "error" }
    // Before the first calendar sync the tables are empty, not "no events": stay loading so a
    // shared `?event=` key is not judged stale and stripped (the init gate renders pages meanwhile).
    if (
      synced.status !== "ready" ||
      !synced.data ||
      definitions.status !== "ready" ||
      calendar.status !== "ready"
    )
      return { status: "loading" }
    const instances = listHomeScreenEventInstances(
      entriesInHorizon(calendar.data, nowMs),
      definitions.data,
      nowMs,
      ruleOf
    )
    // The default (running by the overlap rule, else next) is derived from the same instance list.
    const selection = selectActiveHomeScreenEvent(
      instances.map((instance) => instance.entry),
      definitions.data,
      nowMs,
      ruleOf
    )
    const activeRaidRule =
      selection.active && ruleOf
        ? ruleOf(selection.active, definitions.data)
        : null
    return { status: "ready", ...selection, activeRaidRule, instances, nowMs }
  }, [synced, definitions, calendar, nowMs, ruleOf])
}

/**
 * True while any Home Screen Event runs (rule or not). Reads no rules, so the zod-backed `config.hse`
 * parse stays out of the app shell's startup bundle.
 */
export function useIsHomeScreenEventLive(): boolean {
  const state = useHomeScreenEventCalendar()
  return state.status === "ready" && state.active !== null
}
