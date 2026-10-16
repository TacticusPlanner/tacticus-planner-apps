import { getLegendaryEventBattles } from "@workspace/game-catalog/queries"

import type { LegendaryEventBattle } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The catalog battles of several events, by event id (the master table's Estimated mode). */
export function useLegendaryEventsBattles(
  eventIds: readonly string[]
): ReadState<Record<string, LegendaryEventBattle[]>> {
  const key = eventIds.join(",")
  return useReadState(async () => {
    const battles = await Promise.all(
      eventIds.map((eventId) => getLegendaryEventBattles(eventId))
    )
    return Object.fromEntries(
      eventIds.map((eventId, index) => [eventId, battles[index] ?? []])
    )
  }, [key])
}
