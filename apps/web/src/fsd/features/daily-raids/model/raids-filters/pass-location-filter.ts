import type { Rarity } from "@workspace/game-domain"

import type { RaidsFilterBattle, RaidsFilters } from "./raids-filters.domain"

const DEFAULT_SLOTS = 5

const anyOf = (selected: readonly string[], values: readonly string[]) =>
  selected.length === 0 || values.some((value) => selected.includes(value))

/**
 * Port of V1 `CampaignsService.passLocationFilter`: a location passes only when every criterion
 * holds (an empty criterion always passes). `material` is the upgrade being farmed; the rarity
 * criterion restricts only upgrade materials, so shards and evaluations without a material skip it.
 */
export function passLocationFilter(
  battle: RaidsFilterBattle,
  filters: RaidsFilters,
  material?: { rarity: Rarity }
): boolean {
  const { enemiesMin, enemiesMax } = filters
  if (enemiesMin !== undefined && battle.enemiesTotal < enemiesMin) return false
  if (enemiesMax !== undefined && battle.enemiesTotal > enemiesMax) return false
  if (!anyOf(filters.enemiesTypes, battle.enemiesTypes)) return false

  const slots = battle.slots > 0 ? battle.slots : DEFAULT_SLOTS
  if (filters.slots.length > 0 && !filters.slots.includes(slots)) return false

  if (
    filters.campaignTypes.length > 0 &&
    (battle.campaignType === null ||
      !filters.campaignTypes.includes(battle.campaignType))
  ) {
    return false
  }

  if (
    material &&
    filters.upgradeRarities.length > 0 &&
    !filters.upgradeRarities.includes(material.rarity)
  ) {
    return false
  }

  return (
    anyOf(filters.alliesAlliances, [battle.alliesAlliance]) &&
    anyOf(filters.alliesFactions, battle.alliesFactions) &&
    anyOf(filters.enemiesAlliances, battle.enemiesAlliances) &&
    anyOf(filters.enemiesFactions, battle.enemiesFactions) &&
    anyOf(filters.enemiesTraits, battle.enemiesTraits)
  )
}
