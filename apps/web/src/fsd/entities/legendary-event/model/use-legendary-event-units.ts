import { getCharacters } from "@workspace/game-catalog/queries"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import type { LegendaryEventRosterUnit, LegendaryEventUnit } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** Every catalog character, the units a lane's leaderboard is built from. */
export function useLegendaryEventUnits(): ReadState<LegendaryEventUnit[]> {
  return useReadState(() => getCharacters(), [])
}

/** The caller's synced roster; `data` is `undefined` when the `characters` chunk has not synced. */
export function useLegendaryEventRoster(): ReadState<
  LegendaryEventRosterUnit[] | undefined
> {
  return useReadState(() => getPlayerCharacters(), [])
}
