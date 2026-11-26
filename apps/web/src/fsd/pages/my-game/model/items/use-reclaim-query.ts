import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import { readReclaimQuery, writeReclaimQuery } from "./reclaim-query"
import type { ReclaimQuery } from "./reclaim-query"

/** The Reclaim tab's query, read from and written to the URL (replacing the entry). */
export function useReclaimQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readReclaimQuery(params), [params])
  const update = useCallback(
    (patch: Partial<ReclaimQuery>) =>
      setParams((current) => writeReclaimQuery(current, patch), {
        replace: true,
      }),
    [setParams]
  )
  return { query, update }
}
