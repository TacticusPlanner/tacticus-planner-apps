import { useEffect, useMemo, useState } from "react"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"
import { hasEventsCalendarSynced } from "@workspace/game-catalog/queries"

import { combineReadStates, useReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import { selectQuestInstance, type QuestInstance } from "./quest-instance"

const DAY_MS = 86_400_000
/** A quest lasts 3 days plus a 1-day claim window; reading a week back finds one still claimable. */
const LOOKBACK_DAYS = 7
const LOOKAHEAD_DAYS = 120
const TICK_MS = 60_000

export type QuestInstanceState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      instance: QuestInstance<EventsCalendarStorageModel> | null
      /** The instant the selection was made at, for countdowns (render stays pure). */
      nowMs: number
    }

function entriesAround(
  entries: readonly EventsCalendarStorageModel[],
  nowMs: number
) {
  const startMs = nowMs - LOOKBACK_DAYS * DAY_MS
  const endMs = nowMs + LOOKAHEAD_DAYS * DAY_MS
  return entries.filter(
    (entry) =>
      Date.parse(entry.startUtc) < endMs && Date.parse(entry.endUtc) > startMs
  )
}

/** The running Quest Event, else the one in its claim window, else the next one (design D2). */
export function useQuestInstance(): QuestInstanceState {
  // A coarse tick re-selects from the cached calendar across a phase boundary without a reload.
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
  const read = useMemo(
    () => combineReadStates(synced, definitions, calendar),
    [synced, definitions, calendar]
  )

  return useMemo((): QuestInstanceState => {
    if (read.status === "error") return { status: "error", retry: read.retry }
    if (read.status === "loading") return { status: "loading" }
    const [isSynced, definitionsById, entries] = read.data
    if (!isSynced) return { status: "loading" }
    return {
      status: "ready",
      instance: selectQuestInstance(
        entriesAround(entries, nowMs),
        definitionsById,
        nowMs
      ),
      nowMs,
    }
  }, [read, nowMs])
}

/** Whether a quest is running now (not claimable, not a preview), for the navigation's live
 *  indicator (never true while loading). */
export function useIsQuestLive(): boolean {
  const state = useQuestInstance()
  return state.status === "ready" && state.instance?.phase === "running"
}
