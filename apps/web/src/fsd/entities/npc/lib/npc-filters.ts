import type { NpcFilters, NpcGroup, NpcVariation } from "../model/types"

export const emptyNpcFilters: NpcFilters = {
  search: "",
  factionId: null,
  alliance: null,
  attack: null,
  damageTypes: [],
  traits: [],
}

export function hasActiveNpcFilters(filters: NpcFilters): boolean {
  return activeNpcFilterCount(filters) > 0
}

/**
 * Search is deliberately excluded: it is its own always-visible control, not one of the collapsible
 * filters the count badge describes.
 */
export function activeNpcFilterCount(filters: NpcFilters): number {
  return (
    (filters.factionId !== null ? 1 : 0) +
    (filters.alliance !== null ? 1 : 0) +
    (filters.attack !== null ? 1 : 0) +
    filters.damageTypes.length +
    filters.traits.length
  )
}

/** Every damage-type id a variation can deal: melee, ranged, and ability damage profiles. */
export function variationDamageTypes(variation: NpcVariation): string[] {
  const types = new Set<string>([variation.meleeDamage])
  if (variation.rangedDamage) types.add(variation.rangedDamage)
  for (const type of variation.activeAbilityDamage) types.add(type)
  for (const type of variation.passiveAbilityDamage) types.add(type)
  return [...types]
}

/**
 * Whether one variation matches the faction / damage-type / trait filters (damage types and traits are
 * all-of). The name search is a group-level concern — see `matchesNpcSearch` — because it runs against
 * the localized group name, not the variation.
 */
export function matchesNpcFilters(
  variation: NpcVariation,
  filters: NpcFilters
): boolean {
  if (filters.factionId !== null && variation.factionId !== filters.factionId) {
    return false
  }
  if (filters.alliance !== null && variation.alliance !== filters.alliance) {
    return false
  }
  if (filters.attack !== null) {
    const hasRanged = variation.rangedDamage !== null
    if (filters.attack === "ranged" && !hasRanged) return false
    if (filters.attack === "meleeOnly" && hasRanged) return false
  }
  if (filters.damageTypes.length > 0) {
    const dealt = variationDamageTypes(variation)
    if (!filters.damageTypes.every((type) => dealt.includes(type))) return false
  }
  if (
    filters.traits.length > 0 &&
    !filters.traits.every((trait) => variation.traits.includes(trait))
  ) {
    return false
  }
  return true
}

export function matchesNpcSearch(displayName: string, search: string): boolean {
  const needle = search.trim().toLowerCase()
  return needle === "" || displayName.toLowerCase().includes(needle)
}

/** The variations of a group that match the filters (all of them when no filter is active). */
export function matchingVariations(
  group: NpcGroup,
  filters: NpcFilters
): NpcVariation[] {
  return group.variations.filter((variation) =>
    matchesNpcFilters(variation, filters)
  )
}

/**
 * Filters the listed groups: a group stays while its localized name matches the search and at least
 * one variation matches the other filters. `displayName` resolves the localized name for the search.
 */
export function filterNpcGroups(
  groups: readonly NpcGroup[],
  filters: NpcFilters,
  displayName: (group: NpcGroup) => string
): NpcGroup[] {
  return groups.filter(
    (group) =>
      matchesNpcSearch(displayName(group), filters.search) &&
      matchingVariations(group, filters).length > 0
  )
}
