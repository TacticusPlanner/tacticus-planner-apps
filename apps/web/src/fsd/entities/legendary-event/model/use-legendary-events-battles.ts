import { getLegendaryEventsBattles } from "@workspace/game-catalog/queries"

import type { LegendaryEventBattle } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The catalog battles of several events, by event id (the master table's Estimated mode), from
 *  one read of the battle dataset grouped by event. */
export function useLegendaryEventsBattles(
  eventIds: readonly string[]
): ReadState<Record<string, LegendaryEventBattle[]>> {
  const key = eventIds.join(",")
  return useReadState(() => getLegendaryEventsBattles(eventIds), [key])
}
