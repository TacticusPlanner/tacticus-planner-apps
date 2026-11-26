import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  readSuggestionsQuery,
  writeSuggestionsQuery,
} from "./suggestions-query"
import type { SuggestionsQuery } from "./suggestions-query"

/** The Suggestions tab's query, read from and written to the URL (replacing the entry). */
export function useSuggestionsQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readSuggestionsQuery(params), [params])
  const update = useCallback(
    (patch: Partial<SuggestionsQuery>) =>
      setParams((current) => writeSuggestionsQuery(current, patch), {
        replace: true,
      }),
    [setParams]
  )
  return { query, update }
}
