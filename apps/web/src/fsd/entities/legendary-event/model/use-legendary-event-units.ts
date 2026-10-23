import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import type { LegendaryEventRosterUnit, LegendaryEventUnit } from "./types"
import type { ReadState } from "./use-read-state"

function orUndefined<T>(chunk: T | null): T | undefined {
  return chunk ?? undefined
}

/** Every catalog character, the units a lane's leaderboard is built from. */
export function useLegendaryEventUnits(): ReadState<LegendaryEventUnit[]> {
  return useCatalogDataset("characters")
}

/** The caller's synced roster; `data` is `undefined` when the `characters` chunk has not synced. */
export function useLegendaryEventRoster(): ReadState<
  LegendaryEventRosterUnit[] | undefined
> {
  return usePlayerChunk("characters", orUndefined)
}
