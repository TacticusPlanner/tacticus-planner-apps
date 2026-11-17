import { useSyncExternalStore } from "react"

import { safeStorage } from "@/shared/lib"

import { DEFAULT_RAID_GROUPING, isRaidGrouping } from "./raid-grouping"
import type { RaidGrouping } from "./raid-grouping"

/** Where this browser remembers the grouping picked on Dailies > Raids. */
export const RAID_GROUPING_STORAGE_KEY = "dailies.raid-grouping.v1"

// One shared value for every list on every page, as with the Raids Filters. When storage is
// unavailable the value set in this tab survives in `lastValue`, because the raw read stays `null`.
let lastRaw: string | null | undefined
let lastValue: RaidGrouping = DEFAULT_RAID_GROUPING
const listeners = new Set<() => void>()

function getSnapshot(): RaidGrouping {
  const raw = safeStorage.get(RAID_GROUPING_STORAGE_KEY)
  if (raw !== lastRaw) {
    lastRaw = raw
    lastValue = isRaidGrouping(raw) ? raw : DEFAULT_RAID_GROUPING
  }
  return lastValue
}

const getServerSnapshot = (): RaidGrouping => DEFAULT_RAID_GROUPING

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === RAID_GROUPING_STORAGE_KEY || event.key === null)
      listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function setRaidGrouping(next: RaidGrouping) {
  // Best-effort: the in-memory value below still updates for this tab.
  safeStorage.set(RAID_GROUPING_STORAGE_KEY, next)
  lastRaw = safeStorage.get(RAID_GROUPING_STORAGE_KEY)
  lastValue = next
  for (const listener of listeners) listener()
}

/**
 * The raid list grouping, remembered per browser (spec: daily-raids-today, "Raid grouping"). Picked
 * on Dailies > Raids only; every raid list reads it, so they all follow the one choice.
 */
export function useRaidGrouping(): [
  RaidGrouping,
  (next: RaidGrouping) => void,
] {
  const grouping = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return [grouping, setRaidGrouping]
}
