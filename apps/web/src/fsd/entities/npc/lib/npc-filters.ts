import { matchesSearch } from "@/shared/lib"

import type { NpcFilters, NpcGroup, NpcVariation } from "../model/types"
import {
  encounterPlaces,
  type NpcEncounter,
  type NpcEncounterLookup,
} from "./encounters"

export const emptyNpcFilters: NpcFilters = {
  search: "",
  factionId: null,
  alliance: null,
  attack: null,
  gameMode: null,
  encounterGroup: null,
  runningNow: false,
  minCount: null,
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
    (filters.gameMode !== null ? 1 : 0) +
    (filters.encounterGroup !== null ? 1 : 0) +
    (filters.runningNow ? 1 : 0) +
    (filters.minCount !== null ? 1 : 0) +
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

/** Whether the unit itself matches: faction / attack / damage-type / trait (the last two are all-of). */
function matchesNpcAttributes(
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
  return filters.traits.every((trait) => variation.traits.includes(trait))
}

/**
 * The places of an encounter where its own NPC spawns at least `minCount` times (every place without one).
 * A unit filter does not add other NPCs to the count: the number always means the NPC itself. A Guild Raid has
 * no counts, so it never reaches one.
 */
export function matchingEncounterPlaces(
  encounter: NpcEncounter,
  minCount: number | null
): ReadonlySet<string> {
  return new Set(
    encounterPlaces(encounter)
      .filter(
        ({ battle }) => minCount === null || (battle.count ?? 0) >= minCount
      )
      .map(({ key }) => key)
  )
}

/**
 * Whether one encounter of the variation satisfies every chosen encounter filter at once, so a game mode,
 * location, "running now" and count describe the same encounter rather than different ones. Without the
 * `npc-encounters` data any chosen encounter filter matches nothing.
 */
function matchesEncounterFilters(
  variation: NpcVariation,
  filters: NpcFilters,
  encounters?: NpcEncounterLookup
): boolean {
  const { gameMode, encounterGroup, runningNow, minCount } = filters
  if (
    gameMode === null &&
    encounterGroup === null &&
    !runningNow &&
    minCount === null
  ) {
    return true
  }
  return (
    encounters
      ?.encountersOf(variation.id)
      .some(
        (encounter) =>
          (gameMode === null || encounter.source === gameMode) &&
          (encounterGroup === null || encounter.groupId === encounterGroup) &&
          (!runningNow || encounters.isRunning(encounter)) &&
          (minCount === null ||
            matchingEncounterPlaces(encounter, minCount).size > 0)
      ) ?? false
  )
}

/**
 * Whether one variation matches the unit and encounter filters. The name search is a group-level concern —
 * see `matchesNpcSearch` — because it runs against the localized group name, not the variation.
 */
export function matchesNpcFilters(
  variation: NpcVariation,
  filters: NpcFilters,
  encounters?: NpcEncounterLookup
): boolean {
  return (
    matchesNpcAttributes(variation, filters) &&
    matchesEncounterFilters(variation, filters, encounters)
  )
}

function matchesNpcSearch(displayName: string, search: string): boolean {
  return matchesSearch(displayName, search)
}

/** The variations of a group that match the filters (all of them when no filter is active). */
export function matchingVariations(
  group: NpcGroup,
  filters: NpcFilters,
  encounters?: NpcEncounterLookup
): NpcVariation[] {
  return group.variations.filter((variation) =>
    matchesNpcFilters(variation, filters, encounters)
  )
}

/**
 * Filters the listed groups: a group stays while its localized name matches the search and at least
 * one variation matches the other filters. `displayName` resolves the localized name for the search.
 */
export function filterNpcGroups(
  groups: readonly NpcGroup[],
  filters: NpcFilters,
  displayName: (group: NpcGroup) => string,
  encounters?: NpcEncounterLookup
): NpcGroup[] {
  return groups.filter(
    (group) =>
      matchesNpcSearch(displayName(group), filters.search) &&
      matchingVariations(group, filters, encounters).length > 0
  )
}
