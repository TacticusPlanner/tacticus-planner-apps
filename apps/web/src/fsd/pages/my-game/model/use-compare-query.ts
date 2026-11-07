import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  COMPARE_LATEST,
  COMPARE_PARAM,
  readCompareQuery,
  serializeCompare,
  type CompareParamFixes,
  type CompareQuery,
} from "./compare-query"

export interface CompareQueryState {
  query: CompareQuery
  /** Changes the given parts in one history replacement. */
  update: (patch: Partial<CompareQuery>) => void
  /** Turns compare mode on (`compare=latest`) or off (removes every compare param). */
  setEnabled: (enabled: boolean) => void
  /** Applies fixes found against the loaded sources, in one replacement. */
  applyFixes: (fixes: CompareParamFixes) => void
}

/**
 * Compare mode's state, owned by the URL (`?compare=&to=&le=&lane=&order=`) next to Collection's
 * own params, under the same rules: history is replaced, defaults are omitted and invalid values
 * are dropped; ids are checked once the sources load (`useCollectionCompare`).
 */
export function useCompareQuery(): CompareQueryState {
  const [params, setParams] = useSearchParams()
  const { query, fixes } = useMemo(() => readCompareQuery(params), [params])

  const applyFixes = useCallback(
    (pending: CompareParamFixes) => {
      if (Object.keys(pending).length === 0) return
      setParams(
        (previous) => {
          for (const [param, value] of Object.entries(pending)) {
            if (value == null) previous.delete(param)
            else previous.set(param, value)
          }
          return previous
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const fixesKey = Object.keys(fixes).length > 0 ? JSON.stringify(fixes) : ""
  useEffect(() => {
    if (fixesKey) applyFixes(JSON.parse(fixesKey) as CompareParamFixes)
  }, [fixesKey, applyFixes])

  const update = useCallback(
    (patch: Partial<CompareQuery>) => {
      const next: CompareParamFixes = {}
      for (const key of Object.keys(patch) as (keyof CompareQuery)[]) {
        next[COMPARE_PARAM[key]] = serializeCompare(key, patch[key] as never)
      }
      if (patch.event === null) next[COMPARE_PARAM.lane] = null
      applyFixes(next)
    },
    [applyFixes]
  )

  const setEnabled = useCallback(
    (enabled: boolean) =>
      applyFixes(
        enabled
          ? { [COMPARE_PARAM.compare]: COMPARE_LATEST }
          : Object.fromEntries(
              Object.values(COMPARE_PARAM).map((param) => [param, null])
            )
      ),
    [applyFixes]
  )

  return { query, update, setEnabled, applyFixes }
}
