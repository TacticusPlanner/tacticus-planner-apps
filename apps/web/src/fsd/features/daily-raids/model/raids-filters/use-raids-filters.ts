import { useSyncExternalStore } from "react"
import { z } from "zod"
import { Rarity } from "@workspace/game-domain"

import {
  emptyRaidsFilters,
  RAIDS_CAMPAIGN_TYPES,
  type RaidsFilters,
} from "./raids-filters.domain"

const STORAGE_KEY = "raids-filters.v1"

const storedFiltersSchema = z.object({
  alliesAlliances: z.array(z.string()).default([]),
  alliesFactions: z.array(z.string()).default([]),
  enemiesAlliances: z.array(z.string()).default([]),
  enemiesFactions: z.array(z.string()).default([]),
  // Added after the first release of `raids-filters.v1`: stored filters without it still parse.
  enemiesTraits: z.array(z.string()).default([]),
  campaignTypes: z.array(z.enum(RAIDS_CAMPAIGN_TYPES)).default([]),
  upgradeRarities: z.array(z.enum(Rarity)).default([]),
  slots: z.array(z.number()).default([]),
  enemiesTypes: z.array(z.string()).default([]),
  enemiesMin: z.number().optional(),
  enemiesMax: z.number().optional(),
})

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function parse(raw: string | null): RaidsFilters {
  if (raw === null) return emptyRaidsFilters
  try {
    const result = storedFiltersSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : emptyRaidsFilters
  } catch {
    return emptyRaidsFilters
  }
}

// One shared value for every consumer. `lastRaw` keeps the snapshot referentially stable until the
// stored string changes (another tab, a test clearing storage); when storage is unavailable the value
// written in this tab survives in `lastValue` because the raw read stays `null` either way.
let lastRaw: string | null | undefined
let lastValue: RaidsFilters = emptyRaidsFilters
const listeners = new Set<() => void>()

function getSnapshot(): RaidsFilters {
  const raw = readRaw()
  if (raw !== lastRaw) {
    lastRaw = raw
    lastValue = parse(raw)
  }
  return lastValue
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function setRaidsFilters(next: RaidsFilters) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Best-effort: the in-memory value below still updates for this tab.
  }
  lastRaw = readRaw()
  lastValue = next
  listeners.forEach((listener) => listener())
}

/**
 * The applied Raids Filters, persisted per browser (`raids-filters.v1`) and shared by every mount and
 * tab. Invalid or unavailable storage reads as the empty filter.
 */
export function useRaidsFilters(): [
  RaidsFilters,
  (next: RaidsFilters) => void,
] {
  const filters = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => emptyRaidsFilters
  )
  return [filters, setRaidsFilters]
}
