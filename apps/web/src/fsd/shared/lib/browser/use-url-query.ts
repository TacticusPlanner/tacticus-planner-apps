import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

/**
 * A page's query (search, filters, chips, view) read from and written to the URL. Writes replace
 * the history entry, so Back leaves the page rather than stepping through filter changes.
 */
export function useUrlQuery<Query>(
  read: (params: URLSearchParams) => Query,
  write: (params: URLSearchParams, patch: Partial<Query>) => URLSearchParams
) {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => read(params), [read, params])
  const update = useCallback(
    (patch: Partial<Query>) =>
      setParams((current) => write(current, patch), { replace: true }),
    [setParams, write]
  )
  return { query, update }
}
