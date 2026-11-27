import { rarityOrder, rarityRank } from "@workspace/game-domain"
import type { BattleId, Rarity, UpgradeId } from "@workspace/game-domain"

import { dropRate } from "@/entities/goal-farming"
import type { FarmLocation } from "@/shared/lib"

import { UPGRADE_STATS } from "./inventory-upgrades-query"
import type {
  InventoryGroup,
  InventorySort,
  InventoryUpgradesQuery,
  UpgradeStat,
} from "./inventory-upgrades-query"

/** The catalog fields a material row needs (an `UpgradeWithFarmLocations` fits). */
export interface InventoryUpgradeSource {
  id: UpgradeId
  label: string
  rarity: Rarity
  stat: string
  crafted: boolean
  recipe: readonly { material: UpgradeId; count: number }[]
  farmLocations: readonly FarmLocation[]
}

/** A material's need from the goals (`PlanUpgradeNeed`). */
export interface InventoryUpgradeNeed {
  need: number
  short: number
  goalIds: readonly string[]
}

/** One material on the Upgrades tab. */
export interface InventoryUpgradeRow {
  id: UpgradeId
  name: string
  rarity: Rarity
  stat: string
  crafted: boolean
  have: number
  need: number
  short: number
  goalIds: readonly string[]
  /** How many more a crafted material can be made from what is held now; null for a basic one. */
  canCraft: number | null
}

/** The game's placeholder materials ("Coming soon"), hidden unless one is somehow held. */
const PLACEHOLDER_LABEL = "Coming soon"

/** Owned amounts by id (several entries for one id add up). */
export function heldById(
  inventory: readonly { upgradeId: string; amount: number }[]
): Map<UpgradeId, number> {
  const held = new Map<UpgradeId, number>()
  for (const entry of inventory) {
    const id = entry.upgradeId as UpgradeId
    held.set(id, (held.get(id) ?? 0) + entry.amount)
  }
  return held
}

/** Whether `count` of `id` can be made from `stock` (spent in place), crafting what is short. */
function take(
  id: UpgradeId,
  count: number,
  stock: Map<UpgradeId, number>,
  upgradesById: ReadonlyMap<UpgradeId, InventoryUpgradeSource>,
  path: Set<UpgradeId>
): boolean {
  const held = stock.get(id) ?? 0
  const used = Math.min(held, count)
  stock.set(id, held - used)
  const left = count - used
  if (left === 0) return true
  const upgrade = upgradesById.get(id)
  if (!upgrade?.crafted || upgrade.recipe.length === 0 || path.has(id))
    return false
  path.add(id)
  const ok = upgrade.recipe.every((part) =>
    take(part.material, part.count * left, stock, upgradesById, path)
  )
  path.delete(id)
  return ok
}

/** Whether `count` more of a crafted `id` can be made, from its recipe (not from the held item). */
function canMake(
  id: UpgradeId,
  count: number,
  held: ReadonlyMap<UpgradeId, number>,
  upgradesById: ReadonlyMap<UpgradeId, InventoryUpgradeSource>
): boolean {
  const upgrade = upgradesById.get(id)
  if (!upgrade) return false
  const stock = new Map(held)
  const path = new Set([id])
  return upgrade.recipe.every((part) =>
    take(part.material, part.count * count, stock, upgradesById, path)
  )
}

/** How many more of a crafted material the held stock makes, crafting its crafted parts as needed
 *  (the game's craft button, run until it can't); null for a basic material. */
export function craftableCount(
  id: UpgradeId,
  held: ReadonlyMap<UpgradeId, number>,
  upgradesById: ReadonlyMap<UpgradeId, InventoryUpgradeSource>
): number | null {
  const upgrade = upgradesById.get(id)
  if (!upgrade?.crafted || upgrade.recipe.length === 0) return null
  // Every craft uses up at least one held piece, so it can't run more often than the whole held
  // stock; the cap also stops a recipe with count-0 parts (bad catalog data) from doubling forever.
  let limit = 0
  for (const amount of held.values()) limit += Math.max(0, amount)
  let low = 0
  let high = 1
  while (high <= limit && canMake(id, high, held, upgradesById)) {
    low = high
    high *= 2
  }
  high = Math.min(high, limit + 1)
  // Largest count that can be made lies in [low, high).
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (canMake(id, middle, held, upgradesById)) low = middle
    else high = middle
  }
  return low
}

/** Every catalog material as a row: what is held, what the goals need and what can be crafted. */
export function buildUpgradeRows(params: {
  upgrades: readonly InventoryUpgradeSource[]
  held: ReadonlyMap<UpgradeId, number>
  needs: ReadonlyMap<UpgradeId, InventoryUpgradeNeed>
  name: (id: UpgradeId, fallback: string) => string
}): InventoryUpgradeRow[] {
  const upgradesById = new Map(params.upgrades.map((u) => [u.id, u]))
  return params.upgrades
    .filter(
      (upgrade) =>
        upgrade.label !== PLACEHOLDER_LABEL ||
        (params.held.get(upgrade.id) ?? 0) > 0
    )
    .map((upgrade) => {
      const need = params.needs.get(upgrade.id)
      return {
        id: upgrade.id,
        name: params.name(upgrade.id, upgrade.label),
        rarity: upgrade.rarity,
        stat: upgrade.stat,
        crafted: upgrade.crafted,
        have: params.held.get(upgrade.id) ?? 0,
        need: need?.need ?? 0,
        short: need?.short ?? 0,
        goalIds: need?.goalIds ?? [],
        canCraft: craftableCount(upgrade.id, params.held, upgradesById),
      }
    })
}

const normalize = (text: string) => text.toLocaleLowerCase().trim()

/** The rows the search, chips and Filters panel let through. */
export function filterUpgradeRows(
  rows: readonly InventoryUpgradeRow[],
  query: InventoryUpgradesQuery
): InventoryUpgradeRow[] {
  const search = normalize(query.search)
  return rows.filter(
    (row) =>
      (search === "" || normalize(row.name).includes(search)) &&
      (query.rarities.length === 0 || query.rarities.includes(row.rarity)) &&
      (query.stats.length === 0 ||
        query.stats.includes(row.stat as UpgradeStat)) &&
      (query.kind === null || (query.kind === "crafted") === row.crafted) &&
      (!query.needed || row.need > 0) &&
      (!query.owned || row.have > 0)
  )
}

const statRank = (stat: string) => {
  const index = UPGRADE_STATS.indexOf(stat as UpgradeStat)
  return index === -1 ? UPGRADE_STATS.length : index
}

/** The grid's order: highest rarity first, then stat (Health, Damage, Armour), basic before crafted,
 *  then name. */
function byRarity(a: InventoryUpgradeRow, b: InventoryUpgradeRow) {
  return firstDifference(
    rarityRank(b.rarity) - rarityRank(a.rarity),
    statRank(a.stat) - statRank(b.stat),
    Number(a.crafted) - Number(b.crafted),
    a.name.localeCompare(b.name)
  )
}

/** The first comparison that tells two rows apart. */
const firstDifference = (...differences: number[]) =>
  differences.find((difference) => difference !== 0) ?? 0

/** Rows in the chosen order; counts sort highest first, ties in the grid's order. */
export function sortUpgradeRows(
  rows: readonly InventoryUpgradeRow[],
  sort: InventorySort
): InventoryUpgradeRow[] {
  if (sort === "rarity") return rows.toSorted(byRarity)
  if (sort === "name") {
    return rows.toSorted((a, b) =>
      firstDifference(a.name.localeCompare(b.name), byRarity(a, b))
    )
  }
  return rows.toSorted((a, b) =>
    firstDifference(b[sort] - a[sort], byRarity(a, b))
  )
}

export type UpgradeRowGroup =
  | { kind: "all"; key: "all"; rows: InventoryUpgradeRow[] }
  | { kind: "rarity"; key: Rarity; rows: InventoryUpgradeRow[] }
  | { kind: "stat"; key: string; rows: InventoryUpgradeRow[] }

/** The sorted rows split by Group by: rarities Mythic first, stats in the game's order. Empty groups
 *  are left out. */
export function groupUpgradeRows(
  rows: readonly InventoryUpgradeRow[],
  group: InventoryGroup
): UpgradeRowGroup[] {
  if (group === "none") return [{ kind: "all", key: "all", rows: [...rows] }]
  if (group === "rarity") {
    return rarityOrder
      .toReversed()
      .map((rarity) => ({
        kind: "rarity" as const,
        key: rarity,
        rows: rows.filter((row) => row.rarity === rarity),
      }))
      .filter((entry) => entry.rows.length > 0)
  }
  const stats = [...new Set(rows.map((row) => row.stat))].toSorted((a, b) =>
    firstDifference(statRank(a) - statRank(b), a.localeCompare(b))
  )
  return stats.map((stat) => ({
    kind: "stat" as const,
    key: stat,
    rows: rows.filter((row) => row.stat === stat),
  }))
}

/** One part of a recipe, with what is held of it and its own parts when it is crafted. */
export interface RecipeNode {
  id: UpgradeId
  /** How many one craft of the parent takes. */
  count: number
  have: number
  parts: RecipeNode[]
}

/** A crafted material's recipe as a tree, each part with its held count. */
export function recipeTree(
  id: UpgradeId,
  held: ReadonlyMap<UpgradeId, number>,
  upgradesById: ReadonlyMap<UpgradeId, InventoryUpgradeSource>,
  path: ReadonlySet<UpgradeId> = new Set()
): RecipeNode[] {
  const upgrade = upgradesById.get(id)
  if (!upgrade?.crafted || path.has(id)) return []
  const nextPath = new Set([...path, id])
  return upgrade.recipe.map((part) => ({
    id: part.material,
    count: part.count,
    have: held.get(part.material) ?? 0,
    parts: recipeTree(part.material, held, upgradesById, nextPath),
  }))
}

/** A farm location with its energy cost and the energy one drop takes on average. */
export interface FarmSpot {
  battleId: BattleId
  energyCost: number
  dropRate: number
  energyPerItem: number
}

/** A material's cheapest farm locations, by the energy one drop takes; locations the catalog has no
 *  battle for, or that never drop it, are left out. */
export function bestFarmSpots(
  locations: readonly FarmLocation[],
  energyOf: (battleId: BattleId) => number | undefined,
  limit = 4
): FarmSpot[] {
  return locations
    .flatMap((location) => {
      const energyCost = energyOf(location.battleId)
      const rate = dropRate(location)
      if (energyCost === undefined || rate <= 0) return []
      return [
        {
          battleId: location.battleId,
          energyCost,
          dropRate: rate,
          energyPerItem: energyCost / rate,
        },
      ]
    })
    .toSorted((a, b) => a.energyPerItem - b.energyPerItem)
    .slice(0, limit)
}
