import {
  isProgression,
  isRank,
  rarityOrder,
  type Alliance,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { UnitKind } from "@/entities/unit"

export const collectionSorts = [
  "rarity",
  "rank",
  "abilities",
  "shards",
] as const
export type CollectionSort = (typeof collectionSorts)[number]
export const defaultCollectionSort: CollectionSort = "rarity"

export const collectionQuickFilters = [
  "readyToRankUp",
  "needToAscend",
  "canAscend",
  "needToLevel",
  "blueStarReady",
  "missingEquipment",
  "abilitiesBehindLevel",
] as const
export type CollectionQuickFilter = (typeof collectionQuickFilters)[number]

/** The alliances a player can filter by; Neutral has no playable units. */
export const collectionAlliances = ["Imperial", "Chaos", "Xenos"] as const

export const collectionOwnerships = ["owned", "unowned"] as const
type CollectionOwnership = (typeof collectionOwnerships)[number]

export const collectionKinds = [
  "character",
  "mow",
] as const satisfies readonly UnitKind[]

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
  ownership: CollectionOwnership | null
  kind: UnitKind | null
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
  ownership: null,
  kind: null,
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
}

const includes =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value)

export const isCollectionSort = includes(collectionSorts)
export const isCollectionQuickFilter = includes(collectionQuickFilters)
export const isCollectionAlliance = includes(collectionAlliances)
export const isCollectionOwnership = includes(collectionOwnerships)
export const isCollectionKind = includes(collectionKinds)
export const isCollectionRarity = includes(rarityOrder)
export const isCollectionAttackType = includes(collectionAttackTypes)
export const isCollectionShardSource = includes(collectionShardSources)
export const isCollectionProgression = (value: unknown): value is Progression =>
  typeof value === "string" && isProgression(value)
export const isCollectionRank = (value: unknown): value is Rank =>
  typeof value === "string" && isRank(value)

/**
 * How many filters are active: the search, each standalone filter that is set (a range with a
 * lowest and a highest end counts once) and the quick filter. The sort is not a filter.
 */
export function activeFilterCount(query: CollectionQuery): number {
  return [
    query.search.trim() !== "",
    query.alliance !== null,
    query.factions.length > 0,
    query.rarities.length > 0,
    query.rankMin !== null || query.rankMax !== null,
    query.starsMin !== null || query.starsMax !== null,
    query.ownership !== null,
    query.kind !== null,
    query.attack !== null,
    query.hitsMin !== null || query.hitsMax !== null,
    query.movement !== null,
    query.rangeMin !== null || query.rangeMax !== null,
    query.damageTypes.length > 0,
    query.traits.length > 0,
    query.shardSources.length > 0,
    query.quick !== null,
  ].filter(Boolean).length
}

/** The standalone filters only (no search, no quick filter): what opens the filter panel. */
export function activeStandaloneFilterCount(query: CollectionQuery): number {
  return (
    activeFilterCount(query) -
    (query.search.trim() !== "" ? 1 : 0) -
    (query.quick !== null ? 1 : 0)
  )
}
