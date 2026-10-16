import {
  progressionRarity,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type {
  HordeTierAlliance,
  HordeTierList,
  LegendaryEventRosterUnit,
} from "@/entities/legendary-event"

/** The Tier List's own filters, kept in the URL query (`q`, `owned`, `alliance`). */
export interface TierListUrlFilters {
  query: string
  onlyOwned: boolean
  alliance: HordeTierAlliance
}

export const DEFAULT_TIER_LIST_FILTERS: TierListUrlFilters = {
  query: "",
  onlyOwned: false,
  alliance: "all",
}

export const TIER_LIST_ALLIANCES: readonly HordeTierAlliance[] = [
  "all",
  "Imperial",
  "Chaos",
  "Xenos",
]

const ALLIANCE_PARAMS: Readonly<
  Record<Exclude<HordeTierAlliance, "all">, string>
> = {
  Imperial: "imperial",
  Chaos: "chaos",
  Xenos: "xenos",
}

const allianceFromParam = (value: string | null): HordeTierAlliance => {
  const match = Object.entries(ALLIANCE_PARAMS).find(
    ([, param]) => param === value?.toLowerCase()
  )
  return match ? (match[0] as HordeTierAlliance) : "all"
}

/** Reads the filters from the URL query; a missing or invalid value falls back to its default. */
export function parseTierListFilters(
  params: URLSearchParams
): TierListUrlFilters {
  return {
    query: params.get("q") ?? "",
    onlyOwned: params.get("owned") === "1",
    alliance: allianceFromParam(params.get("alliance")),
  }
}

/** The URL query for `filters`, keeping unrelated params; defaults are left out of the URL. */
export function tierListSearchParams(
  current: URLSearchParams,
  filters: TierListUrlFilters
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (filters.query) next.set("q", filters.query)
  else next.delete("q")
  if (filters.onlyOwned) next.set("owned", "1")
  else next.delete("owned")
  if (filters.alliance === "all") next.delete("alliance")
  else next.set("alliance", ALLIANCE_PARAMS[filters.alliance])
  return next
}

/** Any filter differs from its default. */
export function hasActiveFilters(filters: TierListUrlFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.onlyOwned ||
    filters.alliance !== "all"
  )
}

/** The filters left no character in any row, Untiered included. */
export function isTierListEmpty(list: HordeTierList): boolean {
  return (
    list.rows.every((row) => row.units.length === 0) &&
    list.untiered.length === 0
  )
}

/** A multiplier as "2.0×" / "1.95×": one to two decimals in the reader's locale. */
export function formatMultiplier(value: number, locale?: string): string {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)}×`
}

/** A tile's ownership for its details: rarity and rank, not unlocked, or unknown (no roster). */
type TierTileOwnership =
  | { state: "owned"; rarity: Rarity; rank: Rank }
  | { state: "locked" }
  | { state: "unknown" }

/** What a tile's details show (spec: tile details). */
export interface TierTileDetails {
  unitId: string
  /** The tier name, or null for an untiered character. */
  tier: string | null
  multiplier: number
  /** The tier's multiplier, only when the character's own one overrides it. */
  tierMultiplier: number | null
  ownership: TierTileOwnership
}

export function tierTileDetails(
  tile: { unitId: string; multiplier: number; overridden: boolean },
  row: { tier: string; multiplier: number } | null,
  roster: readonly LegendaryEventRosterUnit[] | undefined
): TierTileDetails {
  const owned = roster?.find((unit) => unit.unitId === tile.unitId)
  let ownership: TierTileOwnership = { state: "unknown" }
  if (owned) {
    ownership = {
      state: "owned",
      rarity: progressionRarity(owned.progressionIndex),
      rank: owned.rank,
    }
  } else if (roster) {
    ownership = { state: "locked" }
  }
  return {
    unitId: tile.unitId,
    tier: row?.tier ?? null,
    multiplier: tile.multiplier,
    tierMultiplier: row && tile.overridden ? row.multiplier : null,
    ownership,
  }
}
