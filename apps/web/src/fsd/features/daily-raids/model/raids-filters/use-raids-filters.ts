import { Rarity } from "@workspace/game-domain"

import { emptyRaidsFilters, RAIDS_CAMPAIGN_TYPES } from "./raids-filters.domain"
import type { RaidsCampaignType, RaidsFilters } from "./raids-filters.domain"
import { storedPreference, useStoredPreference } from "@/shared/lib"

const RAIDS_FILTERS = storedPreference("dailies", "raidsFilters")

// Validated by hand rather than with zod, which would otherwise be this hook's only reason to put
// zod in the startup bundle (the shell reads the filters). Same contract as the earlier schema:
// unknown keys are dropped, a missing list reads as empty (`enemiesTraits` was added after the first
// release of the stored filters), and any malformed field rejects the whole stored value.
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

function parseRaidsFilters(stored: unknown): RaidsFilters {
  if (stored === undefined) return emptyRaidsFilters
  try {
    return toRaidsFilters(stored)
  } catch {
    return emptyRaidsFilters
  }
}

/**
 * The applied Raids Filters, persisted per browser (the `tp.dailies` record) and shared by every
 * mount and tab. Invalid or unavailable storage reads as the empty filter.
 */
export function useRaidsFilters(): [
  RaidsFilters,
  (next: RaidsFilters) => void,
] {
  return useStoredPreference(RAIDS_FILTERS, parseRaidsFilters)
}
