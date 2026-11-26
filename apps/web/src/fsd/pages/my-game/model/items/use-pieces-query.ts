import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import { readPiecesQuery, writePiecesQuery } from "./pieces-query"
import type { PiecesQuery } from "./pieces-query"

/** The Pieces tab's query, read from and written to the URL (replacing the entry, so Back leaves
 *  the page rather than stepping through filter changes). */
export function usePiecesQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readPiecesQuery(params), [params])
  const update = useCallback(
    (patch: Partial<PiecesQuery>) =>
      setParams((current) => writePiecesQuery(current, patch), {
        replace: true,
      }),
    [setParams]
  )
  return { query, update }
}
