import type {
  CharacterStorageModel,
  MowStorageModel,
  UnitSummons,
} from "@workspace/game-catalog"
import type { Alliance, Rarity } from "@workspace/game-domain"

import type { UnitKind } from "@/entities/unit"

import { unitFilterShardSources } from "./unit-filters"
import type { UnitFilterShardSource, UnitFilters } from "./unit-filters"

type UnitAbility = MowStorageModel["abilities"][number]

/** A character's catalog properties the combat filters match on. */
export interface CombatProfile {
  meleeHits: number
  rangedHits: number | null
  rangeDistance: number | null
  movement: number
  /** Melee, ranged, active and passive ability damage types. */
  damageTypes: ReadonlySet<string>
  traits: ReadonlySet<string>
  /** The campaign types its shards drop in, or only `none`. */
  shardSources: ReadonlySet<UnitFilterShardSource>
}

export type CombatCharacter = Pick<
  CharacterStorageModel,
  | "meleeHits"
  | "meleeDamage"
  | "rangedHits"
  | "rangedDamage"
  | "rangeDistance"
  | "movement"
  | "traits"
  | "activeAbilityDamage"
  | "passiveAbilityDamage"
  | "shardLocations"
>

/** What the catalog-level unit filters read of a unit. */
export interface FilterableUnit {
  kind: UnitKind
  alliance: Alliance
  factionId: string
  /** The rarity the Rarity filter matches; a unit without one never matches while it is set. */
  rarity: Rarity | undefined
  /** What its abilities can summon (catalog `summons`). */
  summons: UnitSummons
  /** Its curated ability tags (catalog `abilities`). */
  abilityTags: readonly UnitAbility[]
  /** Characters only: what the combat filters read. */
  combat?: CombatProfile
}

/** Every damage type a character deals: melee, ranged and both abilities. */
export function damageTypesOf(character: CombatCharacter): string[] {
  return [
    character.meleeDamage,
    character.rangedDamage,
    ...character.activeAbilityDamage,
    ...character.passiveAbilityDamage,
  ].filter((type): type is string => !!type)
}

const campaignTypes = new Set<string>(
  unitFilterShardSources.filter((source) => source !== "none")
)

/** The campaign types a character's shards drop in (mythic shard drops aside), or only `none`. */
export function shardSourcesOf(
  character: Pick<CombatCharacter, "shardLocations">
): Set<UnitFilterShardSource> {
  const sources = new Set<UnitFilterShardSource>()
  for (const location of character.shardLocations) {
    if (!location.isMythic && campaignTypes.has(location.type)) {
      sources.add(location.type as UnitFilterShardSource)
    }
  }
  if (sources.size === 0) sources.add("none")
  return sources
}

export function combatProfile(character: CombatCharacter): CombatProfile {
  return {
    meleeHits: character.meleeHits,
    rangedHits: character.rangedHits,
    rangeDistance: character.rangeDistance,
    movement: character.movement,
    damageTypes: new Set(damageTypesOf(character)),
    traits: new Set(character.traits),
    shardSources: shardSourcesOf(character),
  }
}

/** An inclusive range test, either end optional and a backwards range read swapped; `undefined`
 *  when neither end is set. */
export function range(
  low: number | null,
  high: number | null
): ((value: number) => boolean) | undefined {
  if (low === null && high === null) return undefined
  const ends = [low, high].filter((end): end is number => end !== null)
  const min = ends.length === 2 ? Math.min(...ends) : (low ?? -Infinity)
  const max = ends.length === 2 ? Math.max(...ends) : (high ?? Infinity)
  return (value) => value >= min && value <= max
}

/** One ability carrying every Ability filter tag set; `undefined` when none is set. */
function abilityMatcher(
  filters: UnitFilters
): ((ability: UnitAbility) => boolean) | undefined {
  const {
    abilityRole: role,
    abilityTarget: target,
    abilityAttack: attack,
  } = filters
  if (role === null && target === null && attack === null) return undefined
  return (ability) =>
    (role === null || ability.roles.includes(role)) &&
    (target === null || ability.target === target) &&
    (attack === null || ability.attack === attack)
}

/** Whether the hit count the attack type names (either one without it) is in range. */
function hitsMatch(
  combat: CombatProfile,
  attack: UnitFilters["attack"],
  hits: (value: number) => boolean
): boolean {
  const rangedHits = combat.rangedHits ?? 0
  const meleeIn = hits(combat.meleeHits)
  const rangedIn = rangedHits > 0 && hits(rangedHits)
  if (attack === "melee") return meleeIn
  if (attack === "ranged") return rangedIn
  return meleeIn || rangedIn
}

/**
 * V1's roster filter (`CharactersService.passesRosterFilter`) over the combat profile, plus the
 * shard source; `undefined` when no combat filter is set. Hits read the melee or ranged count per
 * the attack type, either one without it; a melee-only character never matches a range; damage
 * types and traits need every picked value, Mechanical also met by Living Metal; a shard source
 * matches any picked one.
 */
function combatMatcher(
  filters: UnitFilters
): ((combat: CombatProfile) => boolean) | undefined {
  const hits = range(filters.hitsMin, filters.hitsMax)
  const reach = range(filters.rangeMin, filters.rangeMax)
  if (
    filters.attack === null &&
    !hits &&
    filters.movement === null &&
    !reach &&
    filters.damageTypes.length === 0 &&
    filters.traits.length === 0 &&
    filters.shardSources.length === 0
  ) {
    return undefined
  }
  return (combat) => {
    const rangedHits = combat.rangedHits ?? 0
    const isRanged = rangedHits > 0
    if (filters.attack === "melee" && isRanged) return false
    if (filters.attack === "ranged" && !isRanged) return false
    if (hits && !hitsMatch(combat, filters.attack, hits)) return false
    if (filters.movement !== null && combat.movement !== filters.movement)
      return false
    if (
      reach &&
      (combat.rangeDistance === null || !reach(combat.rangeDistance))
    )
      return false
    if (filters.damageTypes.some((type) => !combat.damageTypes.has(type)))
      return false
    const hasTrait = (trait: string) =>
      combat.traits.has(trait) ||
      (trait === "Mechanical" && combat.traits.has("LivingMetal"))
    if (!filters.traits.every(hasTrait)) return false
    return (
      filters.shardSources.length === 0 ||
      filters.shardSources.some((source) => combat.shardSources.has(source))
    )
  }
}

/**
 * The catalog-level filters as one test: alliance, faction, rarity, unit type, summons, the Ability
 * filters and the combat filters (a unit without a combat profile, a Machine of War, never matches
 * while one is set). The roster filters (rank and stars ranges) are left to the caller.
 */
export function unitFilterMatcher(
  filters: UnitFilters
): (unit: FilterableUnit) => boolean {
  const factions = new Set(filters.factions)
  const rarities = new Set(filters.rarities)
  const matchesCombat = combatMatcher(filters)
  const matchesAbility = abilityMatcher(filters)
  return (unit) => {
    if (filters.alliance !== null && unit.alliance !== filters.alliance)
      return false
    if (factions.size > 0 && !factions.has(unit.factionId)) return false
    if (rarities.size > 0 && (!unit.rarity || !rarities.has(unit.rarity)))
      return false
    if (matchesCombat && (!unit.combat || !matchesCombat(unit.combat)))
      return false
    if (filters.kind !== null && unit.kind !== filters.kind) return false
    if (filters.summons !== null && unit.summons !== filters.summons)
      return false
    return !matchesAbility || unit.abilityTags.some(matchesAbility)
  }
}
