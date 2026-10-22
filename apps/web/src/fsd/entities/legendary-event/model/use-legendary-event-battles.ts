import { useCallback } from "react"

import { useCatalogDataset } from "@/shared/local-data"

import type { LegendaryEventBattle } from "./types"
import type { ReadState } from "./use-read-state"

/** The event's catalog battles on every lane; order a lane's with `laneBattlePowers`. */
export function useLegendaryEventBattles(
  eventId: string
): ReadState<LegendaryEventBattle[]> {
  const select = useCallback(
    (rows: LegendaryEventBattle[]) =>
      rows.filter((row) => row.lreId === eventId),
    [eventId]
  )
  return useCatalogDataset("lre-battles", select)
}
