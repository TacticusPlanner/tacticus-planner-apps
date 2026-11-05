import { useEffect, useMemo, useState } from "react"
import { hasEventsCalendarSynced } from "@workspace/game-catalog/queries"

import { combineReadStates, useReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import { selectHreInstance } from "./hre-instance"

const TICK_MS = 60_000

/**
 * Whether an HRE is running now, for the navigation's live indicator (never true while loading).
 * Reads only the calendar, not the heroes or the HRE rules, so the app shell's startup bundle stays
 * small (`useHreInstance` carries the tab's selection and instance list).
 */
export function useIsHreLive(): boolean {
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
  const read = useMemo(
    () => combineReadStates(synced, definitions, calendar),
    [synced, definitions, calendar]
  )
  return useMemo(() => {
    if (read.status !== "ready") return false
    const [isSynced, definitionsById, entries] = read.data
    return (
      isSynced &&
      selectHreInstance(entries, definitionsById, nowMs)?.status === "running"
    )
  }, [read, nowMs])
}
