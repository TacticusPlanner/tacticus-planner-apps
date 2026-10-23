import { useSyncExternalStore } from "react"
import { Rarity } from "@workspace/game-domain"

import {
  emptyRaidsFilters,
  RAIDS_CAMPAIGN_TYPES,
  type RaidsCampaignType,
  type RaidsFilters,
} from "./raids-filters.domain"
import { safeStorage } from "@/shared/lib"

const STORAGE_KEY = "raids-filters.v1"

// Validated by hand rather than with zod, which would otherwise be this hook's only reason to put
// zod in the startup bundle (the shell reads the filters). Same contract as the earlier schema:
// unknown keys are dropped, a missing list reads as empty (`enemiesTraits` was added after the first
// release of `raids-filters.v1`), and any malformed field rejects the whole stored value.
const rarities: readonly unknown[] = Object.values(Rarity)

function listOf<T>(value: unknown, isItem: (item: unknown) => item is T) {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every(isItem)) throw new TypeError()
  return value
}
const isString = (item: unknown): item is string => typeof item === "string"
const isNumber = (item: unknown): item is number => typeof item === "number"
const isCampaignType = (item: unknown): item is RaidsCampaignType =>
  (RAIDS_CAMPAIGN_TYPES as readonly unknown[]).includes(item)
const isRarity = (item: unknown): item is Rarity => rarities.includes(item)

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || isNumber(value)) return value
  throw new TypeError()
}

function toRaidsFilters(value: unknown): RaidsFilters {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError()
  }
  const stored = value as Record<string, unknown>
  const enemiesMin = optionalNumber(stored.enemiesMin)
  const enemiesMax = optionalNumber(stored.enemiesMax)
  return {
    alliesAlliances: listOf(stored.alliesAlliances, isString),
    alliesFactions: listOf(stored.alliesFactions, isString),
    enemiesAlliances: listOf(stored.enemiesAlliances, isString),
    enemiesFactions: listOf(stored.enemiesFactions, isString),
    enemiesTraits: listOf(stored.enemiesTraits, isString),
    campaignTypes: listOf(stored.campaignTypes, isCampaignType),
    upgradeRarities: listOf(stored.upgradeRarities, isRarity),
    slots: listOf(stored.slots, isNumber),
    enemiesTypes: listOf(stored.enemiesTypes, isString),
    ...(enemiesMin === undefined ? {} : { enemiesMin }),
    ...(enemiesMax === undefined ? {} : { enemiesMax }),
  }
}

function readRaw(): string | null {
  return safeStorage.get(STORAGE_KEY)
}

function parse(raw: string | null): RaidsFilters {
  if (raw === null) return emptyRaidsFilters
  try {
    return toRaidsFilters(JSON.parse(raw))
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
  // Best-effort: the in-memory value below still updates for this tab.
  safeStorage.set(STORAGE_KEY, JSON.stringify(next))
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
