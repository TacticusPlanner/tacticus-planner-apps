import { allianceRank, factionRank } from "@workspace/game-domain"
import type { Alliance, FactionId, UnitId } from "@workspace/game-domain"

export type UnitListItem = {
  id: UnitId
  name: string
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

/** Case-insensitive name search; an empty query keeps everything. */
export function searchUnits<Item extends UnitListItem>(
  items: readonly Item[],
  query: string,
  locale?: string
): Item[] {
  const needle = query.trim().toLocaleLowerCase(locale)
  if (!needle) return [...items]
  return items.filter((item) =>
    item.name.toLocaleLowerCase(locale).includes(needle)
  )
}
