import type { Rarity } from "@workspace/game-domain"
import { rarityOrder, rarityRank } from "@workspace/game-domain"

import { ITEM_SLOT_TYPES, itemSlotRank } from "@/shared/equipment"

import type { CatalogItem, OwnedPiece } from "./owned-items"
import { readFlag, readList, readOneOf, writeUrlQuery } from "@/shared/lib"

export const PIECES_LAYOUTS = ["cards", "table"] as const
export type PiecesLayout = (typeof PIECES_LAYOUTS)[number]

export const PIECES_GROUPS = ["slot", "rarity", "none"] as const
export type PiecesGroup = (typeof PIECES_GROUPS)[number]

/** The Pieces tab's search, filters, chips and view, all carried in the URL. */
export type PiecesQuery = {
  q: string
  rarity: Rarity[]
  slot: string[]
  faction: string[]
  character: string[]
  /** Relics only (a chip that narrows the list; it never touches the rarity filter). */
  relic: boolean
  /** Items with at least one spare copy. */
  spares: boolean
  layout: PiecesLayout
  group: PiecesGroup
  /** The item whose details are open. */
  piece: string | null
}

export const DEFAULT_PIECES_QUERY: PiecesQuery = {
  q: "",
  rarity: [],
  slot: [],
  faction: [],
  character: [],
  relic: false,
  spares: false,
  layout: "cards",
  group: "slot",
  piece: null,
}

/** Everything that narrows the list, cleared. */
export const CLEARED_PIECES_FILTERS: Partial<PiecesQuery> = {
  q: "",
  rarity: [],
  slot: [],
  faction: [],
  character: [],
  relic: false,
  spares: false,
}

/** The Filters panel's fields, cleared (search and chips stay). */
export const CLEARED_PIECES_PANEL: Partial<PiecesQuery> = {
  rarity: [],
  slot: [],
  faction: [],
  character: [],
}

/** Reads the query from the URL; unknown values are dropped. */
export function readPiecesQuery(params: URLSearchParams): PiecesQuery {
  return {
    q: params.get("q") ?? "",
    rarity: readList(params, "rarity").filter((value): value is Rarity =>
      (rarityOrder as readonly string[]).includes(value)
    ),
    slot: readList(params, "slot").filter((value) =>
      (ITEM_SLOT_TYPES as readonly string[]).includes(value)
    ),
    faction: readList(params, "faction"),
    character: readList(params, "character"),
    relic: readFlag(params, "relic"),
    spares: readFlag(params, "spares"),
    layout: readOneOf(params.get("layout"), PIECES_LAYOUTS, "cards"),
    group: readOneOf(params.get("group"), PIECES_GROUPS, "slot"),
    piece: params.get("piece") || null,
  }
}

/** Writes a change into the URL's parameters, leaving defaults out and other parameters alone. */
export const writePiecesQuery = (
  params: URLSearchParams,
  patch: Partial<PiecesQuery>
): URLSearchParams => writeUrlQuery(params, patch, DEFAULT_PIECES_QUERY)

/** How many filters are set inside the Filters panel (search and chips are counted apart). */
export function activePiecesFilterCount(query: PiecesQuery): number {
  return [query.rarity, query.slot, query.faction, query.character].filter(
    (values) => values.length > 0
  ).length
}

/** Whether any filter, chip or search narrows the list. */
export function piecesQueryNarrows(query: PiecesQuery): boolean {
  return (
    query.q.trim() !== "" ||
    activePiecesFilterCount(query) > 0 ||
    query.relic ||
    query.spares
  )
}

/** What the filters need to know about characters: each one's faction and eligible item ids. */
export type PiecesCharacterIndex = ReadonlyMap<
  string,
  { faction: string; eligible: ReadonlySet<string> }
>

/** The factions an item is for: its allowed factions, or the factions of the characters it is
 *  unique to. */
export function itemFactions(
  item: CatalogItem,
  characters: PiecesCharacterIndex
): string[] {
  if (item.allowedFactions.length > 0) return [...item.allowedFactions]
  return [
    ...new Set(
      item.allowedUnits
        .map((unitId) => characters.get(unitId)?.faction)
        .filter((faction): faction is string => faction !== undefined)
    ),
  ]
}

/** The pieces the query keeps. `nameOf` is the item's displayed name, which the search matches. */
export function filterPieces<Item extends CatalogItem>(
  pieces: readonly OwnedPiece<Item>[],
  query: PiecesQuery,
  {
    nameOf,
    characters,
    locale,
  }: {
    nameOf: (item: Item) => string
    characters: PiecesCharacterIndex
    locale: string
  }
): OwnedPiece<Item>[] {
  const search = query.q.trim().toLocaleLowerCase(locale)
  return pieces.filter(
    ({ item, spare }) =>
      (search === "" ||
        nameOf(item).toLocaleLowerCase(locale).includes(search)) &&
      (!query.relic || item.isRelic) &&
      (!query.spares || spare > 0) &&
      (query.rarity.length === 0 || query.rarity.includes(item.rarity)) &&
      (query.slot.length === 0 || query.slot.includes(item.type)) &&
      (query.faction.length === 0 ||
        itemFactions(item, characters).some((faction) =>
          query.faction.includes(faction)
        )) &&
      (query.character.length === 0 ||
        query.character.some(
          (id) => characters.get(id)?.eligible.has(item.id) === true
        ))
  )
}

export type PiecesGroupEntry<Item extends CatalogItem> = {
  /** The slot type or rarity the group is for; "all" when not grouped. */
  key: string
  pieces: OwnedPiece<Item>[]
}

/** The pieces in groups: by slot type (in slot order), by rarity (highest first), or one group. */
export function groupPieces<Item extends CatalogItem>(
  pieces: readonly OwnedPiece<Item>[],
  group: PiecesGroup
): PiecesGroupEntry<Item>[] {
  if (group === "none")
    return pieces.length > 0 ? [{ key: "all", pieces: [...pieces] }] : []
  const keyOf = (piece: OwnedPiece<Item>) =>
    group === "slot" ? piece.item.type : piece.item.rarity
  const groups = new Map<string, OwnedPiece<Item>[]>()
  for (const piece of pieces) {
    const key = keyOf(piece)
    groups.set(key, [...(groups.get(key) ?? []), piece])
  }
  return [...groups]
    .map(([key, entries]) => ({ key, pieces: entries }))
    .toSorted((a, b) =>
      group === "slot"
        ? itemSlotRank(a.key) - itemSlotRank(b.key)
        : rarityRank(b.key as Rarity) - rarityRank(a.key as Rarity)
    )
}
