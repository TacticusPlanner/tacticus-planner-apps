import type { Rarity } from "@workspace/game-domain"

/** V1's six campaign-type options. See `raidsCampaignTypeOf` for how a V2 battle maps to one. */
export const RAIDS_CAMPAIGN_TYPES = [
  "Elite",
  "Extremis",
  "Standard",
  "Mirror",
  "Normal",
  "Early",
] as const
export type RaidsCampaignType = (typeof RAIDS_CAMPAIGN_TYPES)[number]

/** Slot counts a campaign location can have. */
export const RAIDS_SLOT_OPTIONS = [3, 4, 5] as const

/** Upgrade rarities the filter offers: V1's Shard and Mythic Shard options were no-ops and are dropped. */
export const RAIDS_UPGRADE_RARITIES: readonly Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
]

/**
 * The applied Raids Filters. Every list is "any of"; an empty list (or unset bound) matches
 * everything. Ids are plain strings so a stored id the catalog no longer has is tolerated (it simply
 * never matches) instead of invalidating the whole filter.
 */
export type RaidsFilters = {
  alliesAlliances: string[]
  alliesFactions: string[]
  enemiesAlliances: string[]
  enemiesFactions: string[]
  enemiesTraits: string[]
  campaignTypes: RaidsCampaignType[]
  upgradeRarities: Rarity[]
  slots: number[]
  enemiesTypes: string[]
  enemiesMin?: number
  enemiesMax?: number
}

export const emptyRaidsFilters: RaidsFilters = {
  alliesAlliances: [],
  alliesFactions: [],
  enemiesAlliances: [],
  enemiesFactions: [],
  enemiesTraits: [],
  campaignTypes: [],
  upgradeRarities: [],
  slots: [],
  enemiesTypes: [],
}

/** The number of filter groups set, as the trigger badge shows it (each of the eleven fields counts once). */
export function countActiveFilterGroups(filters: RaidsFilters): number {
  return (
    [
      filters.alliesAlliances,
      filters.alliesFactions,
      filters.enemiesAlliances,
      filters.enemiesFactions,
      filters.enemiesTraits,
      filters.enemiesTypes,
      filters.campaignTypes,
      filters.slots,
      filters.upgradeRarities,
    ].filter((list) => list.length > 0).length +
    (filters.enemiesMin !== undefined ? 1 : 0) +
    (filters.enemiesMax !== undefined ? 1 : 0)
  )
}

/** What the matcher reads of one catalog battle (the campaign type is precomputed from its group). */
export type RaidsFilterBattle = {
  slots: number
  alliesAlliance: string
  alliesFactions: readonly string[]
  enemiesAlliances: readonly string[]
  enemiesFactions: readonly string[]
  /** Union of the traits of the battle's enemies (empty while the npc dataset is loading). */
  enemiesTraits: readonly string[]
  enemiesTotal: number
  enemiesTypes: readonly string[]
  campaignType: RaidsCampaignType | null
}
