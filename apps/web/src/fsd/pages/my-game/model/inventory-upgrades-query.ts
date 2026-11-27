import { rarityOrder } from "@workspace/game-domain"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

/** The game's three upgrade stats, as the catalog names them. */
export const UPGRADE_STATS = ["Health", "Damage", "Armour"] as const
export type UpgradeStat = (typeof UPGRADE_STATS)[number]

export const UPGRADE_KINDS = ["basic", "crafted"] as const
export type UpgradeKind = (typeof UPGRADE_KINDS)[number]

export const INVENTORY_LAYOUTS = ["grid", "table"] as const
export type InventoryLayout = (typeof INVENTORY_LAYOUTS)[number]

export const INVENTORY_GROUPS = ["none", "rarity", "stat"] as const
export type InventoryGroup = (typeof INVENTORY_GROUPS)[number]

/** Table order: Rarity (highest first, the grid's order), or by a column. */
export const INVENTORY_SORTS = [
  "rarity",
  "name",
  "have",
  "need",
  "short",
] as const
export type InventorySort = (typeof INVENTORY_SORTS)[number]

/** What the Upgrades tab shows, all of it in the URL so a view can be shared or bookmarked. */
export interface InventoryUpgradesQuery {
  search: string
  rarities: Rarity[]
  stats: UpgradeStat[]
  /** Basic or crafted only; null lists both. */
  kind: UpgradeKind | null
  /** Only what the goals need ("Needed for goals"). */
  needed: boolean
  /** Only what the player holds ("Owned only"); off by default, phones too. */
  owned: boolean
  layout: InventoryLayout
  group: InventoryGroup
  sort: InventorySort
  /** The material whose details sheet is open. */
  material: UpgradeId | null
}

export const DEFAULT_INVENTORY_UPGRADES_QUERY: InventoryUpgradesQuery = {
  search: "",
  rarities: [],
  stats: [],
  kind: null,
  needed: false,
  owned: false,
  layout: "grid",
  group: "rarity",
  sort: "rarity",
  material: null,
}

const PARAM = {
  search: "q",
  rarities: "rarity",
  stats: "stat",
  kind: "kind",
  needed: "needed",
  owned: "owned",
  layout: "layout",
  group: "group",
  sort: "sort",
  material: "material",
} as const satisfies Record<keyof InventoryUpgradesQuery, string>

const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    (values as readonly unknown[]).includes(value)

const isRarity = isOneOf(rarityOrder)
const isStat = isOneOf(UPGRADE_STATS)
const isKind = isOneOf(UPGRADE_KINDS)
const isLayout = isOneOf(INVENTORY_LAYOUTS)
const isGroup = isOneOf(INVENTORY_GROUPS)
const isSort = isOneOf(INVENTORY_SORTS)

/** A comma list's valid items, in a fixed order and without repeats. */
function listOf<T extends string>(
  raw: string | null,
  order: readonly T[],
  isItem: (value: unknown) => value is T
): T[] {
  const items = new Set((raw ?? "").split(",").filter(isItem))
  return order.filter((item) => items.has(item))
}

/** The query the URL holds; an unknown value reads as its default. */
export function readInventoryUpgradesQuery(
  params: URLSearchParams
): InventoryUpgradesQuery {
  const one = <T extends string>(
    key: keyof InventoryUpgradesQuery,
    isValid: (value: unknown) => value is T
  ): T | null => {
    const raw = params.get(PARAM[key])
    return isValid(raw) ? raw : null
  }
  const defaults = DEFAULT_INVENTORY_UPGRADES_QUERY
  return {
    search: params.get(PARAM.search) ?? "",
    rarities: listOf(params.get(PARAM.rarities), rarityOrder, isRarity),
    stats: listOf(params.get(PARAM.stats), UPGRADE_STATS, isStat),
    kind: one("kind", isKind),
    needed: params.get(PARAM.needed) === "1",
    owned: params.get(PARAM.owned) === "1",
    layout: one("layout", isLayout) ?? defaults.layout,
    group: one("group", isGroup) ?? defaults.group,
    sort: one("sort", isSort) ?? defaults.sort,
    material: (params.get(PARAM.material) as UpgradeId | null) || null,
  }
}

/** `params` with `patch` applied; a part back at its default leaves the URL. */
export function writeInventoryUpgradesQuery(
  params: URLSearchParams,
  patch: Partial<InventoryUpgradesQuery>
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(patch) as [
    keyof InventoryUpgradesQuery,
    InventoryUpgradesQuery[keyof InventoryUpgradesQuery],
  ][]) {
    const param = PARAM[key]
    const text = Array.isArray(value)
      ? value.join(",")
      : typeof value === "boolean"
        ? value
          ? "1"
          : ""
        : (value ?? "")
    const fallback = DEFAULT_INVENTORY_UPGRADES_QUERY[key]
    if (text === "" || text === fallback) next.delete(param)
    else next.set(param, text)
  }
  return next
}

/** The Filters panel's active count: each switch that is on, and rarity, stat and kind when set. */
export function activePanelFilterCount(query: InventoryUpgradesQuery): number {
  return (
    Number(query.needed) +
    Number(query.owned) +
    Number(query.rarities.length > 0) +
    Number(query.stats.length > 0) +
    Number(query.kind !== null)
  )
}

/** The panel's fields at their defaults (its "Clear filters"). */
export const CLEARED_PANEL_FILTERS: Partial<InventoryUpgradesQuery> = {
  needed: false,
  owned: false,
  rarities: [],
  stats: [],
  kind: null,
}

/** Everything that narrows the list (search and the panel) at its default; the view stays. */
export const CLEARED_FILTERS: Partial<InventoryUpgradesQuery> = {
  ...CLEARED_PANEL_FILTERS,
  search: "",
}

export function hasActiveFilters(query: InventoryUpgradesQuery): boolean {
  return query.search.trim() !== "" || activePanelFilterCount(query) > 0
}
