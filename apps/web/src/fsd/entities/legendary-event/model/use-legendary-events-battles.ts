import { useCallback } from "react"

import { useCatalogDataset } from "@/shared/local-data"

import type { LegendaryEventBattle } from "./types"
import type { ReadState } from "./use-read-state"

/** The catalog battles of several events, by event id (the master table's Estimated mode), from
 *  the one cached battle dataset grouped by event. Every requested id is present. */
export function useLegendaryEventsBattles(
  eventIds: readonly string[]
): ReadState<Record<string, LegendaryEventBattle[]>> {
  const key = eventIds.join(",")
  const select = useCallback(
    (rows: LegendaryEventBattle[]) => {
      const grouped: Record<string, LegendaryEventBattle[]> =
        Object.fromEntries((key ? key.split(",") : []).map((id) => [id, []]))
      for (const row of rows) grouped[row.lreId]?.push(row)
      return grouped
    },
    [key]
  )
  return useCatalogDataset("lre-battles", select)
}
