import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  readInventoryUpgradesQuery,
  writeInventoryUpgradesQuery,
} from "./inventory-upgrades-query"
import type { InventoryUpgradesQuery } from "./inventory-upgrades-query"

/** The Upgrades tab's query, read from and written to the URL (replacing the entry, so Back leaves
 *  the page rather than stepping through filter changes). */
export function useInventoryUpgradesQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readInventoryUpgradesQuery(params), [params])
  const update = useCallback(
    (patch: Partial<InventoryUpgradesQuery>) =>
      setParams((current) => writeInventoryUpgradesQuery(current, patch), {
        replace: true,
      }),
    [setParams]
  )
  return { query, update }
}
