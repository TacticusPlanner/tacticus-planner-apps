import type {
  CharacterStorageModel,
  EquipmentStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  allianceRank,
  progressionIndex,
  progressionRarity,
  rankIndex,
  type Alliance,
  type Rarity,
  type UnitId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { UnitKind, UnitTileUnit } from "@/entities/unit"

import {
  defaultCollectionQuery,
  activeFilterCount,
  type CollectionQuery,
  type CollectionSort,
} from "./collection-query"
import {
  blueStarReady,
  canAscend,
  needToAscend,
  needToLevel,
  orbsForAlliance,
  type AscensionLadder,
  type QuickFilterUnit,
} from "./collection-quick-filters"

type CatalogCharacter = Pick<
  CharacterStorageModel,
  "id" | "name" | "faction" | "alliance" | "initialRarity"
>
type CatalogMow = Pick<MowStorageModel, "id" | "name" | "faction" | "alliance">
type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]
type InventoryOrbs = PlayerDataChunkDto<"inventory">["orbs"]

/**
 * Where the player's roster stands: `available` once both the `characters` and `mows` chunks have
 * synced, `notSynced` for a signed-in user missing either (sync writes chunks one at a time, so
 * counting a lone chunk would show every unit of the other kind as unowned and undercount the
 * summary), `anonymous` for a signed-out visitor, and `error` when reading the roster failed.
 */
export type CollectionRosterState =
  "available" | "notSynced" | "anonymous" | "error"

export type CollectionRoster =
  | { state: "anonymous" }
  | { state: "error" }
  | {
      state: "signedIn"
      characters: PlayerCharacter[] | undefined
      mows: PlayerMow[] | undefined
      /** Unowned-unit shard progress; undefined while that chunk has not synced. */
      shards: InventoryShard[] | undefined
    }

export interface CollectionCatalog {
  characters: CatalogCharacter[]
  mows: CatalogMow[]
  unlockShardCosts: Pick<UnlockShardCostStorageModel, "rarity" | "shards">[]
  /** Only the rarity is read, to frame each equipped item. */
  equipmentRarity: ReadonlyMap<string, Pick<EquipmentStorageModel, "rarity">>
}

export interface CollectionLabels {
  /** The localized unit name; `fallback` is the catalog's English name. */
  unitName: (kind: UnitKind, unitId: string, fallback: string) => string
  factionName: (factionId: string) => string
  locale: string
}

/**
 * What the quick filters read beyond the roster. A quick filter whose input is missing matches no
 * unit; the caller only selects one once its data is available.
 */
export interface CollectionExtras {
  /** Can ascend and Blue star ready: the catalog's ascension cost ladder. */
  ladder?: AscensionLadder
  /** Can ascend and Blue star ready: the player's orbs, per alliance. */
  orbs?: InventoryOrbs
  /** Ready to rank up: the owned characters whose current rank the inventory can finish. */
  rankUpReady?: ReadonlySet<string>
}

export interface CollectionFactionGroup {
  factionId: string
  factionName: string
  alliance: Alliance
  units: UnitTileUnit[]
  /** Owned units in this faction; the header shows it against `units.length`. */
  owned: number
}

/** The one structure the page renders and the owned summary is derived from. */
export interface CollectionView {
  rosterState: CollectionRosterState
  groups: CollectionFactionGroup[]
  owned: number
  total: number
  /** A search, filter or quick filter narrowed the list, so the counts cover matching units only. */
  filtered: boolean
  /** The query actually applied: the given one without the parts this roster cannot apply. The
   *  toolbar shows this, so it never marks as selected a value that does not narrow the list. */
  query: CollectionQuery
}

interface CollectionRow {
  unit: UnitTileUnit
  factionId: string
  alliance: Alliance
  /** The catalog (English) name, searched alongside the localized one. */
  catalogName: string
  /** The rarity the Rarity filter matches: current when owned, starting for an unowned character. */
  rarity: Rarity | undefined
  /** Owned rows sort by these, descending. */
  progression: number
  rank: number
  abilities: number
  /** Shards sort: 1 at or past one blue star (ranked by mythic shards), else 0 (by shards). */
  shardTier: number
  shardCount: number
  /** Unowned rows sort by this, descending: the share of the unlock cost already held, or -1. */
  unlock: number
  /** Owned rows only: what the quick filters read. */
  quick?: QuickFilterUnit
}

const blueStarIndex = progressionIndex("Legendary:OneBlueStar")

export function buildCollectionView(
  catalog: CollectionCatalog,
  roster: CollectionRoster,
  labels: CollectionLabels,
  query: CollectionQuery = defaultCollectionQuery,
  extras: CollectionExtras = {}
): CollectionView {
  const rosterState: CollectionRosterState =
    roster.state === "signedIn"
      ? roster.characters === undefined || roster.mows === undefined
        ? "notSynced"
        : "available"
      : roster.state
  const owned =
    roster.state === "signedIn" && rosterState === "available"
      ? roster
      : undefined
  const ownedCharacters = byUnitId(owned?.characters)
  const ownedMows = byUnitId(owned?.mows)
  const shards = owned?.shards ? byUnitId(owned.shards) : undefined
  const unlockCost = new Map(
    catalog.unlockShardCosts.map((cost) => [cost.rarity, cost.shards])
  )

  const rows: CollectionRow[] = [
    ...catalog.characters.map((character) => {
      const record = ownedCharacters.get(character.id)
      const name = labels.unitName("character", character.id, character.name)
      return record
        ? ownedCharacterRow(character, record, name, catalog)
        : unownedRow("character", character, name, {
            rarity: character.initialRarity,
            unlockShards: unlockCost.get(character.initialRarity),
            shards,
          })
    }),
    ...catalog.mows.map((mow) => {
      const record = ownedMows.get(mow.id)
      const name = labels.unitName("mow", mow.id, mow.name)
      return record
        ? ownedMowRow(mow, record, name)
        : unownedRow("mow", mow, name, { shards })
    }),
  ]

  // Without a roster nothing is owned, so the roster-dependent parts of the query cannot apply;
  // they stay in the URL and apply once the roster arrives.
  const effective: CollectionQuery =
    rosterState === "available"
      ? query
      : { ...query, rankMin: null, rankMax: null, ownership: null, quick: null }
  const matches = rowMatcher(effective, extras, labels.locale)

  const groupsById = new Map<string, CollectionFactionGroup>()
  const rowsByFaction = new Map<string, CollectionRow[]>()
  for (const row of rows) {
    if (!matches(row)) continue
    if (!groupsById.has(row.factionId)) {
      groupsById.set(row.factionId, {
        factionId: row.factionId,
        factionName: labels.factionName(row.factionId),
        alliance: row.alliance,
        units: [],
        owned: 0,
      })
      rowsByFaction.set(row.factionId, [])
    }
    rowsByFaction.get(row.factionId)!.push(row)
  }

  const compareNames = (a: string, b: string) =>
    a.localeCompare(b, labels.locale)
  const compareOwned = ownedComparator(query.sort)
  const groups = [...groupsById.values()]
    .sort(
      (a, b) =>
        allianceRank(a.alliance) - allianceRank(b.alliance) ||
        compareNames(a.factionName, b.factionName)
    )
    .map((group) => {
      const units = rowsByFaction
        .get(group.factionId)!
        .sort((a, b) => compareRows(a, b, compareOwned, compareNames))
        .map((row) => row.unit)
      return {
        ...group,
        units,
        owned: units.filter((unit) => unit.data.state === "owned").length,
      }
    })

  const ownedCount = groups.reduce((count, group) => count + group.owned, 0)
  const total = groups.reduce((count, group) => count + group.units.length, 0)

  return {
    rosterState,
    groups,
    owned: ownedCount,
    total,
    filtered: activeFilterCount(effective) > 0,
    query: effective,
  }
}

/** Case- and diacritic-insensitive form of a name or search text. */
function searchable(text: string, locale: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(locale)
}

function rowMatcher(
  query: CollectionQuery,
  extras: CollectionExtras,
  locale: string
): (row: CollectionRow) => boolean {
  const needle = searchable(query.search.trim(), locale)
  const factions = new Set(query.factions)
  const rarities = new Set(query.rarities)
  const low = query.rankMin === null ? -1 : rankIndex(query.rankMin)
  const high =
    query.rankMax === null ? Number.POSITIVE_INFINITY : rankIndex(query.rankMax)
  // A range set backwards still means the ranks between its two ends.
  const rankMin = Math.min(low, high)
  const rankMax = Math.max(low, high)
  const rankRange = query.rankMin !== null || query.rankMax !== null

  return (row) => {
    const isOwned = row.unit.data.state === "owned"
    if (
      needle &&
      !searchable(row.unit.name, locale).includes(needle) &&
      !searchable(row.catalogName, locale).includes(needle)
    ) {
      return false
    }
    if (query.alliance !== null && row.alliance !== query.alliance) return false
    if (factions.size > 0 && !factions.has(row.factionId)) return false
    if (rarities.size > 0 && (!row.rarity || !rarities.has(row.rarity)))
      return false
    if (
      rankRange &&
      (!isOwned ||
        row.unit.kind !== "character" ||
        row.rank < rankMin ||
        row.rank > rankMax)
    ) {
      return false
    }
    if (query.ownership === "owned" && !isOwned) return false
    if (query.ownership === "unowned" && isOwned) return false
    if (query.kind !== null && row.unit.kind !== query.kind) return false
    if (query.quick !== null && !matchesQuick(row, query.quick, extras))
      return false
    return true
  }
}

function matchesQuick(
  row: CollectionRow,
  quick: NonNullable<CollectionQuery["quick"]>,
  extras: CollectionExtras
): boolean {
  const unit = row.quick
  if (!unit) return false
  switch (quick) {
    case "needToAscend":
      return needToAscend(unit)
    case "needToLevel":
      return needToLevel(unit)
    case "canAscend":
    case "blueStarReady": {
      if (!extras.ladder) return false
      const rule = quick === "canAscend" ? canAscend : blueStarReady
      return rule(
        unit,
        extras.ladder,
        orbsForAlliance(extras.orbs, row.alliance)
      )
    }
    case "readyToRankUp":
      return extras.rankUpReady?.has(row.unit.unitId) ?? false
  }
}

type OwnedComparator = (a: CollectionRow, b: CollectionRow) => number

/** The Rarity order, which is also every other sort's tie-break. */
const byRarity: OwnedComparator = (a, b) =>
  b.progression - a.progression || b.rank - a.rank

function ownedComparator(sort: CollectionSort): OwnedComparator {
  switch (sort) {
    case "rarity":
      return byRarity
    case "rank":
      // Machines of War carry rank -1, so they follow the group's characters.
      return (a, b) => b.rank - a.rank || byRarity(a, b)
    case "abilities":
      return (a, b) => b.abilities - a.abilities || byRarity(a, b)
    case "shards":
      return (a, b) =>
        b.shardTier - a.shardTier ||
        b.shardCount - a.shardCount ||
        byRarity(a, b)
  }
}

function compareRows(
  a: CollectionRow,
  b: CollectionRow,
  compareOwned: OwnedComparator,
  compareNames: (a: string, b: string) => number
): number {
  const aOwned = a.unit.data.state === "owned"
  const bOwned = b.unit.data.state === "owned"
  if (aOwned !== bOwned) return aOwned ? -1 : 1
  const byProgress = aOwned ? compareOwned(a, b) : b.unlock - a.unlock
  if (byProgress !== 0) return byProgress
  return compareNames(a.unit.name, b.unit.name)
}

function byUnitId<T extends { unitId: string }>(
  records: T[] | undefined
): Map<string, T> {
  return new Map((records ?? []).map((record) => [record.unitId, record]))
}

/** Sort and filter keys shared by owned characters and Machines of War. */
function ownedKeys(record: PlayerCharacter | PlayerMow) {
  const index = progressionIndex(record.progressionIndex)
  const abilityLevels: [number, number] = [
    record.abilities[0]?.level ?? 1,
    record.abilities[1]?.level ?? 1,
  ]
  const pastBlueStar = index >= blueStarIndex
  return {
    progression: index,
    rarity: progressionRarity(record.progressionIndex),
    abilityLevels,
    abilities: abilityLevels[0] + abilityLevels[1],
    shardTier: pastBlueStar ? 1 : 0,
    shardCount: pastBlueStar ? record.mythicShards : record.shards,
    unlock: -1,
  }
}

function ownedCharacterRow(
  character: CatalogCharacter,
  record: PlayerCharacter,
  name: string,
  catalog: CollectionCatalog
): CollectionRow {
  const { abilityLevels, ...keys } = ownedKeys(record)
  return {
    ...keys,
    factionId: character.faction,
    alliance: character.alliance,
    catalogName: character.name ?? "",
    rank: rankIndex(record.rank),
    quick: {
      kind: "character",
      progression: record.progressionIndex,
      rank: record.rank,
      xpLevel: record.xpLevel,
      shards: record.shards,
      mythicShards: record.mythicShards,
    },
    unit: {
      kind: "character",
      unitId: character.id,
      name,
      data: {
        state: "owned",
        progression: record.progressionIndex,
        rank: record.rank,
        xpLevel: record.xpLevel,
        // Tacticus lists a character's active ability first, then its passive.
        abilityLevels,
        equipment: record.equippedItems.map((item) => ({
          equipmentId: item.equipmentId,
          rarity: catalog.equipmentRarity.get(item.equipmentId)?.rarity,
          level: item.level,
        })),
        shards: record.shards,
        mythicShards: record.mythicShards,
      },
    },
  }
}

function ownedMowRow(
  mow: CatalogMow,
  record: PlayerMow,
  name: string
): CollectionRow {
  const { abilityLevels, ...keys } = ownedKeys(record)
  return {
    ...keys,
    factionId: mow.faction,
    alliance: mow.alliance,
    catalogName: mow.name ?? "",
    // Machines of War have no rank; they tie on it and fall through to name.
    rank: -1,
    quick: {
      kind: "mow",
      progression: record.progressionIndex,
      shards: record.shards,
      mythicShards: record.mythicShards,
    },
    unit: {
      kind: "mow",
      unitId: mow.id,
      name,
      data: {
        state: "owned",
        progression: record.progressionIndex,
        // Primary ability first, then secondary.
        abilityLevels,
        shards: record.shards,
        mythicShards: record.mythicShards,
      },
    },
  }
}

function unownedRow(
  kind: UnitKind,
  unit: { id: UnitId; name?: string; faction: string; alliance: Alliance },
  name: string,
  {
    rarity,
    unlockShards,
    shards,
  }: {
    rarity?: Rarity
    unlockShards?: number
    shards: Map<string, InventoryShard> | undefined
  }
): CollectionRow {
  const inventory = shards?.get(unit.id)
  const held = inventory?.amount ?? 0
  return {
    factionId: unit.faction,
    alliance: unit.alliance,
    catalogName: unit.name ?? "",
    // An unowned character matches the Rarity filter on its starting rarity; an unowned Machine
    // of War has none in the catalog, so it never matches a set Rarity filter.
    rarity,
    progression: -1,
    rank: -1,
    abilities: -1,
    shardTier: -1,
    shardCount: -1,
    // Nearest to unlock first; units with no unlock cost or no shard data go after those with one.
    unlock: shards && unlockShards ? Math.min(1, held / unlockShards) : -1,
    unit: {
      kind,
      unitId: unit.id,
      name,
      data: {
        state: "unowned",
        rarity,
        unlockShards,
        // A unit missing from a synced shard inventory has none; no inventory at all means the
        // count is unknown and the tile shows none.
        shards: shards ? held : undefined,
        mythicShards: shards ? (inventory?.mythicAmount ?? 0) : undefined,
      },
    },
  }
}
