import { useCallback } from "react"

import {
  parseTodayQuickFilters,
  serializeTodayQuickFilters,
} from "./today-quick-filters"
import type { TodayQuickFilter } from "./today-quick-filters"
import {
  storedPreference,
  useStoredPreference,
  writePreference,
} from "@/shared/lib"

/** Where this browser remembers the chips, as a comma-separated list. */
const QUICK_FILTERS_PREFERENCE = storedPreference("dailies", "quickFilters")

const parseStored = (stored: unknown): TodayQuickFilter[] =>
  parseTodayQuickFilters(typeof stored === "string" ? stored : null)

/**
 * Today's quick filters (shared with the HSE and HRE tabs), remembered in this browser so they
 * survive navigating away and reloading.
 */
export function useTodayQuickFilters(): [
  TodayQuickFilter[],
  (next: readonly TodayQuickFilter[]) => void,
] {
  const [filters] = useStoredPreference(QUICK_FILTERS_PREFERENCE, parseStored)
  const setFilters = useCallback((next: readonly TodayQuickFilter[]) => {
    writePreference(
      QUICK_FILTERS_PREFERENCE,
      serializeTodayQuickFilters(next) ?? undefined
    )
  }, [])
  return [filters, setFilters]
}
