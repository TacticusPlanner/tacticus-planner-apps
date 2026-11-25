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

export const collectionSorts = [
  "rarity",
  "rank",
  "abilities",
  "shards",
  "power",
] as const
export type CollectionSort = (typeof collectionSorts)[number]
export const defaultCollectionSort: CollectionSort = "rarity"

/** How the listed units are laid out; Table and Showcase join this list later. */
export const collectionLayouts = ["cards", "roster"] as const
export type CollectionLayout = (typeof collectionLayouts)[number]
export const defaultCollectionLayout: CollectionLayout = "cards"

/** Whether units are grouped by faction or listed together across factions. */
const collectionGroupings = ["faction", "none"] as const
export type CollectionGrouping = (typeof collectionGroupings)[number]
export const defaultCollectionGrouping: CollectionGrouping = "faction"

export const collectionQuickFilters = [
  "readyToRankUp",
  "needToAscend",
  "canPromote",
  "canAscend",
  "needToLevel",
  "blueStarReady",
  "missingEquipment",
  "abilitiesBehindLevel",
] as const
export type CollectionQuickFilter = (typeof collectionQuickFilters)[number]

/** The alliances a player can filter by; Neutral has no playable units. */
export const collectionAlliances = ["Imperial", "Chaos", "Xenos"] as const

export const collectionKinds = [
  "character",
  "mow",
] as const satisfies readonly UnitKind[]

/** What a unit's abilities can summon (catalog `summons`), characters and MoWs alike. */
export const collectionSummons = unitSummons

/** The curated ability tags (catalog `abilities`) the Ability filters match, characters and MoWs alike. */
export const collectionAbilityRoles = abilityRoles
export const collectionAbilityTargets = abilityTargets
export const collectionAbilityAttacks = abilityAttacks

export const collectionAttackTypes = ["melee", "ranged"] as const
type CollectionAttackType = (typeof collectionAttackTypes)[number]

/** The campaign types shards drop in, in the game's order, then "not in any campaign". */
export const collectionShardSources = [
  "Standard",
  "Elite",
  "Mirror",
  "EliteMirror",
  "Extremis",
  "none",
] as const
export type CollectionShardSource = (typeof collectionShardSources)[number]

/** What the Collection toolbar asks of the list; `null`/empty means "not set". */
export interface CollectionQuery {
  search: string
  alliance: Alliance | null
  factions: readonly string[]
  rarities: readonly Rarity[]
  rankMin: Rank | null
  rankMax: Rank | null
  /** Rarity and stars; owned units only. */
  starsMin: Progression | null
  starsMax: Progression | null
  /** Lists owned units only: a display setting, kept in `?owned=owned`; the counts are unchanged. */
  hideUnowned: boolean
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
  attack: CollectionAttackType | null
  hitsMin: number | null
  hitsMax: number | null
  movement: number | null
  rangeMin: number | null
  rangeMax: number | null
  damageTypes: readonly string[]
  traits: readonly string[]
  shardSources: readonly CollectionShardSource[]
  quick: CollectionQuickFilter | null
  sort: CollectionSort
  /** The layout; like the sort it is not a filter and Clear filters keeps it. */
  view: CollectionLayout
  /** Grouped by faction, or one list across factions; not a filter either. */
  group: CollectionGrouping
}

export const defaultCollectionQuery: CollectionQuery = {
  search: "",
  alliance: null,
  factions: [],
  rarities: [],
  rankMin: null,
  rankMax: null,
  starsMin: null,
  starsMax: null,
  hideUnowned: false,
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
  quick: null,
  sort: defaultCollectionSort,
  view: defaultCollectionLayout,
  group: defaultCollectionGrouping,
}

const includes =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value)

export const isCollectionSort = includes(collectionSorts)
export const isCollectionLayout = includes(collectionLayouts)
export const isCollectionGrouping = includes(collectionGroupings)
export const isCollectionQuickFilter = includes(collectionQuickFilters)
export const isCollectionAlliance = includes(collectionAlliances)
export const isCollectionKind = includes(collectionKinds)
export const isCollectionRarity = includes(rarityOrder)
export const isCollectionAttackType = includes(collectionAttackTypes)
export const isCollectionSummons = includes(collectionSummons)
export const isCollectionAbilityRole = includes(collectionAbilityRoles)
export const isCollectionAbilityTarget = includes(collectionAbilityTargets)
export const isCollectionAbilityAttack = includes(collectionAbilityAttacks)
export const isCollectionShardSource = includes(collectionShardSources)
export const isCollectionProgression = (value: unknown): value is Progression =>
  typeof value === "string" && isProgression(value)
export const isCollectionRank = (value: unknown): value is Rank =>
  typeof value === "string" && isRank(value)

/** The Filters panel's sections, in display order. */
const collectionFilterSections = [
  "unit",
  "progression",
  "attack",
  "abilities",
  "more",
] as const
export type CollectionFilterSection = (typeof collectionFilterSections)[number]

const countSet = (...set: boolean[]) => set.filter(Boolean).length

/**
 * How many standalone filters are set in each Filters section (a range with a lowest and a highest
 * end counts once): the count beside each section title.
 */
export function sectionFilterCounts(
  query: CollectionQuery
): Record<CollectionFilterSection, number> {
  return {
    unit: countSet(
      query.alliance !== null,
      query.factions.length > 0,
      query.kind !== null
    ),
    progression: countSet(
      query.rarities.length > 0,
      query.rankMin !== null || query.rankMax !== null,
      query.starsMin !== null || query.starsMax !== null
    ),
    attack: countSet(
      query.attack !== null,
      query.hitsMin !== null || query.hitsMax !== null,
      query.rangeMin !== null || query.rangeMax !== null,
      query.damageTypes.length > 0
    ),
    abilities: countSet(
      query.abilityRole !== null,
      query.abilityTarget !== null,
      query.abilityAttack !== null,
      query.summons !== null
    ),
    more: countSet(
      query.traits.length > 0,
      query.movement !== null,
      query.shardSources.length > 0
    ),
  }
}

/** The standalone filters only (no search, no quick filter): the Filters button's badge. */
export function activeStandaloneFilterCount(query: CollectionQuery): number {
  const counts = sectionFilterCounts(query)
  return collectionFilterSections.reduce(
    (total, section) => total + counts[section],
    0
  )
}

/**
 * How many filters are active: the search, each standalone filter that is set and the quick
 * filter. The sort, the view and the grouping are not filters.
 */
export function activeFilterCount(query: CollectionQuery): number {
  return (
    activeStandaloneFilterCount(query) +
    countSet(query.search.trim() !== "", query.quick !== null)
  )
}

/**
 * The standalone filters (the Filters panel's fields) back at their defaults: the panel's "Clear
 * filters" keeps the search, the quick filter, Owned only and the view settings.
 */
export const clearedStandaloneFilters: Partial<CollectionQuery> = {
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
