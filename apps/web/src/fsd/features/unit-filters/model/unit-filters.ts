import { isProgression, isRank, rarityOrder } from "@workspace/game-domain"
import type {
  Alliance,
  Progression,
  Rank,
  Rarity,
} from "@workspace/game-domain"
import {
  abilityAttacks,
  abilityRoles,
  abilityTargets,
  unitSummons,
} from "@workspace/game-catalog"
import type {
  AbilityAttack,
  AbilityRole,
  AbilityTarget,
  UnitSummons,
} from "@workspace/game-catalog"

import type { UnitKind } from "@/entities/unit"

/** The alliances a player can filter by; Neutral has no playable units. */
export const unitFilterAlliances = ["Imperial", "Chaos", "Xenos"] as const

export const unitFilterKinds = [
  "character",
  "mow",
] as const satisfies readonly UnitKind[]

/** What a unit's abilities can summon (catalog `summons`), characters and MoWs alike. */
export const unitFilterSummons = unitSummons

/** The curated ability tags (catalog `abilities`) the Ability filters match, characters and MoWs alike. */
export const unitFilterAbilityRoles = abilityRoles
export const unitFilterAbilityTargets = abilityTargets
export const unitFilterAbilityAttacks = abilityAttacks

export const unitFilterAttackTypes = ["melee", "ranged"] as const
type UnitFilterAttackType = (typeof unitFilterAttackTypes)[number]

/** The campaign types shards drop in, in the game's order, then "not in any campaign". */
export const unitFilterShardSources = [
  "Standard",
  "Elite",
  "Mirror",
  "EliteMirror",
  "Extremis",
  "none",
] as const
export type UnitFilterShardSource = (typeof unitFilterShardSources)[number]

/**
 * Which units the filters run over: `roster` (My Game > Collection) offers the filters that read
 * the player's roster; `catalog` (the Library) leaves them out, since most visitors have none.
 */
export type UnitFilterScope = "roster" | "catalog"

/** The standalone unit filters (the Filters panel's fields); `null`/empty means "not set". */
export interface UnitFilters {
  alliance: Alliance | null
  factions: readonly string[]
  rarities: readonly Rarity[]
  /** Roster scope only: owned characters' rank. */
  rankMin: Rank | null
  rankMax: Rank | null
  /** Roster scope only: rarity and stars of owned units. */
  starsMin: Progression | null
  starsMax: Progression | null
  kind: UnitKind | null
  /** No summons, optional, conditional or forced summons; characters and MoWs alike. */
  summons: UnitSummons | null
  /**
   * The Ability filters: one of the unit's abilities must carry every set tag (so damage plus AoE finds
   * an AoE damage ability, not a unit with one damage ability and another AoE one).
   */
  abilityRole: AbilityRole | null
  abilityTarget: AbilityTarget | null
  abilityAttack: AbilityAttack | null
  // The combat filters: catalog properties of characters, so they apply signed out too.
  attack: UnitFilterAttackType | null
  hitsMin: number | null
  hitsMax: number | null
  movement: number | null
  rangeMin: number | null
  rangeMax: number | null
  damageTypes: readonly string[]
  traits: readonly string[]
  shardSources: readonly UnitFilterShardSource[]
}

/** Every filter unset: also the panel's "Clear filters" patch. */
export const defaultUnitFilters: UnitFilters = {
  alliance: null,
  factions: [],
  rarities: [],
  rankMin: null,
  rankMax: null,
  starsMin: null,
  starsMax: null,
  kind: null,
  summons: null,
  abilityRole: null,
  abilityTarget: null,
  abilityAttack: null,
  attack: null,
  hitsMin: null,
  hitsMax: null,
  movement: null,
  rangeMin: null,
  rangeMax: null,
  damageTypes: [],
  traits: [],
  shardSources: [],
}

const includes =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value)

export const isUnitFilterAlliance = includes(unitFilterAlliances)
export const isUnitFilterKind = includes(unitFilterKinds)
export const isUnitFilterRarity = includes(rarityOrder)
export const isUnitFilterAttackType = includes(unitFilterAttackTypes)
export const isUnitFilterSummons = includes(unitFilterSummons)
export const isUnitFilterAbilityRole = includes(unitFilterAbilityRoles)
export const isUnitFilterAbilityTarget = includes(unitFilterAbilityTargets)
export const isUnitFilterAbilityAttack = includes(unitFilterAbilityAttacks)
export const isUnitFilterProgression = (value: unknown): value is Progression =>
  typeof value === "string" && isProgression(value)
export const isUnitFilterRank = (value: unknown): value is Rank =>
  typeof value === "string" && isRank(value)

/** The Filters panel's sections, in display order. */
const unitFilterSections = [
  "unit",
  "progression",
  "attack",
  "abilities",
  "more",
] as const
export type UnitFilterSection = (typeof unitFilterSections)[number]

const countSet = (...set: boolean[]) => set.filter(Boolean).length

/**
 * How many filters are set in each Filters section (a range with a lowest and a highest end counts
 * once): the count beside each section title.
 */
export function sectionFilterCounts(
  filters: UnitFilters
): Record<UnitFilterSection, number> {
  return {
    unit: countSet(
      filters.alliance !== null,
      filters.factions.length > 0,
      filters.kind !== null
    ),
    progression: countSet(
      filters.rarities.length > 0,
      filters.rankMin !== null || filters.rankMax !== null,
      filters.starsMin !== null || filters.starsMax !== null
    ),
    attack: countSet(
      filters.attack !== null,
      filters.hitsMin !== null || filters.hitsMax !== null,
      filters.rangeMin !== null || filters.rangeMax !== null,
      filters.damageTypes.length > 0
    ),
    abilities: countSet(
      filters.abilityRole !== null,
      filters.abilityTarget !== null,
      filters.abilityAttack !== null,
      filters.summons !== null
    ),
    more: countSet(
      filters.traits.length > 0,
      filters.movement !== null,
      filters.shardSources.length > 0
    ),
  }
}

/** How many filters are set: the Filters button's badge. */
export function activeUnitFilterCount(filters: UnitFilters): number {
  const counts = sectionFilterCounts(filters)
  return unitFilterSections.reduce(
    (total, section) => total + counts[section],
    0
  )
}

/** One control of the Filters panel; a range is one field. */
export type UnitFilterField =
  | "alliance"
  | "factions"
  | "kind"
  | "rarities"
  | "rank"
  | "stars"
  | "attack"
  | "hits"
  | "range"
  | "damageTypes"
  | "abilityRole"
  | "abilityTarget"
  | "abilityAttack"
  | "summons"
  | "traits"
  | "movement"
  | "shardSources"

/** The fields only the player's roster can answer. */
const rosterFields = new Set<UnitFilterField>(["rank", "stars"])
/** The fields that read catalog properties Machines of War do not have (no starting rarity, no
 *  attack profile, traits or shard drops). */
const characterOnlyFields = new Set<UnitFilterField>([
  "rarities",
  "attack",
  "hits",
  "range",
  "damageTypes",
  "traits",
  "movement",
  "shardSources",
])

/**
 * Whether the Filters panel offers `field`: catalog scope leaves out the roster fields, a list of
 * one kind leaves out Unit type, and a Machines of War list leaves out the character-only fields.
 * Rarity stays for owned Machines of War in roster scope, where it reads their current rarity.
 */
export function offersUnitFilterField(
  field: UnitFilterField,
  { scope, kind }: { scope: UnitFilterScope; kind: UnitKind | null }
): boolean {
  if (scope === "catalog" && rosterFields.has(field)) return false
  if (kind !== null && field === "kind") return false
  if (kind === "mow" && characterOnlyFields.has(field)) {
    return field === "rarities" && scope === "roster"
  }
  return true
}
