import { allianceRank, factionRank } from "@workspace/game-domain"
import type { Alliance, FactionId, UnitId } from "@workspace/game-domain"

import { anyNameIncludes, normalizeSearchText } from "@/shared/lib"

export type UnitListItem = {
  id: UnitId
  name: string
  /** The unit's other names, matched by the search besides `name` (see `useUnitSearchNames`). */
  searchNames?: readonly string[]
  factionId: FactionId
  factionName: string
  alliance: Alliance
}

/** A unit list's order: alliance, then faction (game order), then localized name. */
export function orderUnits<Item extends UnitListItem>(
  items: readonly Item[],
  locale?: string
): Item[] {
  return [...items].sort(
    (a, b) =>
      allianceRank(a.alliance) - allianceRank(b.alliance) ||
      factionRank(a.factionId) - factionRank(b.factionId) ||
      a.name.localeCompare(b.name, locale)
  )
}

/** Loose name search over `name` and `searchNames` (see `normalizeSearchText`); an empty query keeps
 *  everything. */
export function searchUnits<Item extends UnitListItem>(
  items: readonly Item[],
  query: string,
  locale?: string
): Item[] {
  const needle = normalizeSearchText(query, locale)
  if (!needle) return [...items]
  return items.filter((item) =>
    anyNameIncludes([item.name, ...(item.searchNames ?? [])], needle, locale)
  )
}
