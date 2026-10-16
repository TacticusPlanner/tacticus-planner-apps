import { allianceRank, factionRank } from "@workspace/game-domain"
import type { Alliance, FactionId, UnitId } from "@workspace/game-domain"

export type CharacterListItem = {
  id: UnitId
  name: string
  factionId: FactionId
  factionName: string
  alliance: Alliance
}

/** The characters list's order: alliance, then faction (game order), then localized name. */
export function orderCharacters(
  items: readonly CharacterListItem[],
  locale?: string
): CharacterListItem[] {
  return [...items].sort(
    (a, b) =>
      allianceRank(a.alliance) - allianceRank(b.alliance) ||
      factionRank(a.factionId) - factionRank(b.factionId) ||
      a.name.localeCompare(b.name, locale)
  )
}

/** Case-insensitive name search; an empty query keeps everything. */
export function searchCharacters(
  items: readonly CharacterListItem[],
  query: string,
  locale?: string
): CharacterListItem[] {
  const needle = query.trim().toLocaleLowerCase(locale)
  if (!needle) return [...items]
  return items.filter((item) =>
    item.name.toLocaleLowerCase(locale).includes(needle)
  )
}
