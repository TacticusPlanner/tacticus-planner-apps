import { getLegendaryEventBattles } from "@workspace/game-catalog/queries"

import type { LegendaryEventBattle } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The event's catalog battles on every lane; order a lane's with `laneBattlePowers`. */
export function useLegendaryEventBattles(
  eventId: string
): ReadState<LegendaryEventBattle[]> {
  return useReadState(() => getLegendaryEventBattles(eventId), [eventId])
}
