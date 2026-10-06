import { getLegendaryEventCommon } from "@workspace/game-catalog/queries"

import type { LegendaryEventCommon } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The shared reward ladder; `data` is `null` when `lre-common` has not synced. */
export function useLegendaryEventCommon(): ReadState<LegendaryEventCommon | null> {
  return useReadState(() => getLegendaryEventCommon(), [])
}
