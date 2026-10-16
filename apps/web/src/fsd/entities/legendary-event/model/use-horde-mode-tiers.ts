import { getHordeModeTiers } from "@workspace/game-catalog/queries"

import type { HordeModeTierList } from "../lib/horde-tier-list"
import { useReadState, type ReadState } from "./use-read-state"

/** The catalog `horde-mode-tiers` record; `data` is null when the catalog has no such record. */
export function useHordeModeTiers(): ReadState<HordeModeTierList | null> {
  return useReadState(getHordeModeTiers, [])
}
