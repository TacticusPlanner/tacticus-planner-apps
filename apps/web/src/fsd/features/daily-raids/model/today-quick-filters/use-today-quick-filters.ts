import { useEffect, useMemo, useSyncExternalStore } from "react"
import { useSearchParams } from "react-router"

import {
  parseTodayQuickFilters,
  serializeTodayQuickFilters,
} from "./today-quick-filters"
import type { TodayQuickFilter } from "./today-quick-filters"
import { safeStorage } from "@/shared/lib"

/** Where this browser remembers the chips, in the same comma format the URL used to carry. */
const TODAY_QUICK_FILTERS_STORAGE_KEY = "dailies.quick-filters.v1"
/** The URL parameter that held the chips before they were remembered per device. */
const LEGACY_PARAM = "quick"

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
 * survive navigating away and reloading. A link still carrying the earlier `quick` URL parameter is
 * honoured once: its chips are applied and remembered, and the parameter is removed from the URL.
 */
export function useTodayQuickFilters(): [
  TodayQuickFilter[],
  (next: readonly TodayQuickFilter[]) => void,
] {
  const [params, setParams] = useSearchParams()
  const linked = params.get(LEGACY_PARAM)
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (linked === null) return
    setTodayQuickFilters(parseTodayQuickFilters(linked))
    setParams(
      (previous) => {
        previous.delete(LEGACY_PARAM)
        return previous
      },
      { replace: true }
    )
  }, [linked, setParams])

  // Until the effect above moves a linked value into storage, show it rather than the stored one.
  const fromLink = useMemo(
    () => (linked === null ? null : parseTodayQuickFilters(linked)),
    [linked]
  )
  return [fromLink ?? stored, setTodayQuickFilters]
}
