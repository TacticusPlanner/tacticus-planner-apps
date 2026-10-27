import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  parseTodayQuickFilters,
  serializeTodayQuickFilters,
  type TodayQuickFilter,
} from "./today-quick-filters"

const PARAM = "quick"

/**
 * Today's quick filters, read from and written to the URL's `quick` parameter only, so reload and
 * shared links restore them and opening Today without it shows the defaults.
 */
export function useTodayQuickFilters(): [
  TodayQuickFilter[],
  (next: readonly TodayQuickFilter[]) => void,
] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(PARAM)
  const filters = useMemo(() => parseTodayQuickFilters(raw), [raw])
  const setFilters = useCallback(
    (next: readonly TodayQuickFilter[]) => {
      setParams(
        (previous) => {
          const value = serializeTodayQuickFilters(next)
          if (value === null) previous.delete(PARAM)
          else previous.set(PARAM, value)
          return previous
        },
        { replace: true }
      )
    },
    [setParams]
  )
  return [filters, setFilters]
}
