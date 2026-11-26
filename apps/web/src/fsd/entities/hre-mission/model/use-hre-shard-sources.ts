import { useMemo, useState } from "react"
import { hasEventsCalendarSynced } from "@workspace/game-catalog/queries"

import {
  combineReadStates,
  useNow,
  useReadState,
  MINUTE_MS,
} from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import { hreShardSources, nextHreBoundaryMs } from "./hre-shard-sources"
import type { HreShardSource } from "./hre-shard-sources"

const NONE: ReadonlyMap<string, HreShardSource> = new Map()

/**
 * Each featured hero's running or upcoming Hero Release Event, by character id (`hreShardSources`);
 * empty while the calendar loads. The map is re-selected only once an HRE starts or ends, so the
 * plans that read it don't recompute on every clock tick.
 */
export function useHreShardSources(): ReadonlyMap<string, HreShardSource> {
  const [nowMs, setNowMs] = useState(() => Date.now())
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
  const { sources, boundaryMs } = useMemo(() => {
    if (read.status !== "ready" || !read.data[0])
      return { sources: NONE, boundaryMs: null }
    const [, definitionsById, entries] = read.data
    return {
      sources: hreShardSources(entries, definitionsById, nowMs),
      boundaryMs: nextHreBoundaryMs(entries, definitionsById, nowMs),
    }
  }, [read, nowMs])
  // A coarse tick that re-selects only after the next HRE start or end has passed. The shared clock
  // pauses while the tab is hidden and catches up when shown. The next boundary is always after the
  // selection instant, so this update settles in one extra render.
  const passedAtMs = useNow(MINUTE_MS, (clockMs) =>
    boundaryMs !== null && clockMs >= boundaryMs ? clockMs : null
  )
  if (passedAtMs !== null && passedAtMs !== nowMs) setNowMs(passedAtMs)
  return sources
}
