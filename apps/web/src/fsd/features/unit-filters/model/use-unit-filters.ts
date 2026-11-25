import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  UNIT_FILTER_PARAMS,
  applyParamFixes,
  readUnitFilters,
  serializeUnitFilter,
} from "./unit-filter-params"
import type { ParamFixes } from "./unit-filter-params"
import { defaultUnitFilters } from "./unit-filters"
import type { UnitFilterScope, UnitFilters } from "./unit-filters"
import type { UnitFilterOptions } from "./use-unit-filter-options"

export interface UnitFiltersState {
  filters: UnitFilters
  /** Changes the given filters in one history replacement. */
  update: (patch: Partial<UnitFilters>) => void
  /** Unsets every filter in one replacement. */
  clear: () => void
}

/**
 * Unit filters owned by the URL, under the same parameter names as Collection, so reload, Back and
 * a shared link restore them on any page. Invalid values are dropped from the URL and a backwards
 * range is swapped; the values only the catalog knows wait for `options`.
 */
export function useUnitFilters(
  options: UnitFilterOptions | undefined,
  scope: UnitFilterScope
): UnitFiltersState {
  const [params, setParams] = useSearchParams()
  const { filters, fixes } = useMemo(() => {
    const found: ParamFixes = {}
    return {
      filters: readUnitFilters(params, options, found, scope),
      fixes: found,
    }
  }, [params, options, scope])

  const fixesKey = Object.keys(fixes).length > 0 ? JSON.stringify(fixes) : ""
  useEffect(() => {
    if (!fixesKey) return
    const pending = JSON.parse(fixesKey) as ParamFixes
    setParams((previous) => applyParamFixes(previous, pending), {
      replace: true,
    })
  }, [fixesKey, setParams])

  const update = useCallback(
    (patch: Partial<UnitFilters>) => {
      setParams(
        (previous) => {
          for (const key of Object.keys(patch) as (keyof UnitFilters)[]) {
            const value = serializeUnitFilter(patch[key] ?? null)
            if (value === null) previous.delete(UNIT_FILTER_PARAMS[key])
            else previous.set(UNIT_FILTER_PARAMS[key], value)
          }
          return previous
        },
        { replace: true }
      )
    },
    [setParams]
  )
  const clear = useCallback(() => update(defaultUnitFilters), [update])

  return { filters, update, clear }
}
