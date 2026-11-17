import { useSyncExternalStore } from "react"

import {
  parseTodayQuickFilters,
  serializeTodayQuickFilters,
} from "./today-quick-filters"
import type { TodayQuickFilter } from "./today-quick-filters"
import { safeStorage } from "@/shared/lib"

/** Where this browser remembers the chips, as a comma-separated list. */
const TODAY_QUICK_FILTERS_STORAGE_KEY = "dailies.quick-filters.v1"

// One shared value for every mount and tab, as with the Raids Filters. `lastRaw` keeps the snapshot
// referentially stable until the stored string changes; when storage is unavailable the value set in
// this tab survives in `lastValue` because the raw read stays `null` either way.
let lastRaw: string | null | undefined
let lastValue: TodayQuickFilter[] = []
const listeners = new Set<() => void>()

function getSnapshot(): TodayQuickFilter[] {
  const raw = safeStorage.get(TODAY_QUICK_FILTERS_STORAGE_KEY)
  if (raw !== lastRaw) {
    lastRaw = raw
    lastValue = parseTodayQuickFilters(raw)
  }
  return lastValue
}

const getServerSnapshot = (): TodayQuickFilter[] => []

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === TODAY_QUICK_FILTERS_STORAGE_KEY || event.key === null)
      listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function setTodayQuickFilters(next: readonly TodayQuickFilter[]) {
  const value = serializeTodayQuickFilters(next)
  // Best-effort: the in-memory value below still updates for this tab.
  if (value === null) safeStorage.remove(TODAY_QUICK_FILTERS_STORAGE_KEY)
  else safeStorage.set(TODAY_QUICK_FILTERS_STORAGE_KEY, value)
  lastRaw = safeStorage.get(TODAY_QUICK_FILTERS_STORAGE_KEY)
  lastValue = parseTodayQuickFilters(value)
  listeners.forEach((listener) => listener())
}

/**
 * Today's quick filters (shared with the HSE and HRE tabs), remembered in this browser so they
 * survive navigating away and reloading.
 */
export function useTodayQuickFilters(): [
  TodayQuickFilter[],
  (next: readonly TodayQuickFilter[]) => void,
] {
  const filters = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return [filters, setTodayQuickFilters]
}
