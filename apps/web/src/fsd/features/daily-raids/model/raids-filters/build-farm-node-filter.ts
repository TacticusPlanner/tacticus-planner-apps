import type { Rarity } from "@workspace/game-domain"

import type { FarmNodeFilter } from "@/features/goal-farming/@x/daily-raids"

import { passLocationFilter } from "./pass-location-filter"
import {
  countActiveFilterGroups,
  type RaidsFilterBattle,
  type RaidsFilters,
} from "./raids-filters.domain"

/**
 * The engine predicate for the applied filter, or `undefined` for an empty one so an unfiltered run is
 * exactly the current behavior. `upgradesById` supplies the rarity of upgrade materials; a resource it
 * does not know (a character shard) is not restricted by the rarity criterion.
 */
export function buildFarmNodeFilter(
  filters: RaidsFilters,
  battlesById: ReadonlyMap<string, RaidsFilterBattle>,
  upgradesById: ReadonlyMap<string, { rarity: Rarity }>
): FarmNodeFilter | undefined {
  if (countActiveFilterGroups(filters) === 0) return undefined
  return (battleId, resourceId) => {
    const battle = battlesById.get(battleId)
    // A node missing from the filter catalog is a data gap, not a reason to hide the material.
    if (!battle) return true
    return passLocationFilter(battle, filters, upgradesById.get(resourceId))
  }
}
