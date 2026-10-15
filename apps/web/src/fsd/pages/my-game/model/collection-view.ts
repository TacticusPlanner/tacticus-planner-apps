import type {
  CharacterStorageModel,
  EquipmentStorageModel,
  MowStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  allianceRank,
  progressionIndex,
  rankIndex,
  type Alliance,
  type Rarity,
  type UnitId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { UnitKind, UnitTileUnit } from "@/entities/unit"

type CatalogCharacter = Pick<
  CharacterStorageModel,
  "id" | "name" | "faction" | "alliance" | "initialRarity"
>
type CatalogMow = Pick<MowStorageModel, "id" | "name" | "faction" | "alliance">
type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

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
}

interface CollectionRow {
  unit: UnitTileUnit
  factionId: string
  alliance: Alliance
  /** Owned rows sort by these, descending. */
  progression: number
  rank: number
  /** Unowned rows sort by this, descending: the share of the unlock cost already held, or -1. */
  unlock: number
}

export function buildCollectionView(
  catalog: CollectionCatalog,
  roster: CollectionRoster,
  labels: CollectionLabels
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

  const groupsById = new Map<string, CollectionFactionGroup>()
  const rowsByFaction = new Map<string, CollectionRow[]>()
  for (const row of rows) {
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
  const groups = [...groupsById.values()]
    .sort(
      (a, b) =>
        allianceRank(a.alliance) - allianceRank(b.alliance) ||
        compareNames(a.factionName, b.factionName)
    )
    .map((group) => {
      const units = rowsByFaction
        .get(group.factionId)!
        .sort((a, b) => compareRows(a, b, compareNames))
        .map((row) => row.unit)
      return {
        ...group,
        units,
        owned: units.filter((unit) => unit.data.state === "owned").length,
      }
    })

  const ownedCount = groups.reduce((count, group) => count + group.owned, 0)
  const total = groups.reduce((count, group) => count + group.units.length, 0)

  return { rosterState, groups, owned: ownedCount, total }
}

function compareRows(
  a: CollectionRow,
  b: CollectionRow,
  compareNames: (a: string, b: string) => number
): number {
  const aOwned = a.unit.data.state === "owned"
  const bOwned = b.unit.data.state === "owned"
  if (aOwned !== bOwned) return aOwned ? -1 : 1
  const byProgress = aOwned
    ? b.progression - a.progression || b.rank - a.rank
    : b.unlock - a.unlock
  if (byProgress !== 0) return byProgress
  return compareNames(a.unit.name, b.unit.name)
}

function byUnitId<T extends { unitId: string }>(
  records: T[] | undefined
): Map<string, T> {
  return new Map((records ?? []).map((record) => [record.unitId, record]))
}

function ownedCharacterRow(
  character: CatalogCharacter,
  record: PlayerCharacter,
  name: string,
  catalog: CollectionCatalog
): CollectionRow {
  return {
    factionId: character.faction,
    alliance: character.alliance,
    progression: progressionIndex(record.progressionIndex),
    rank: rankIndex(record.rank),
    unlock: -1,
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
        abilityLevels: [
          record.abilities[0]?.level ?? 1,
          record.abilities[1]?.level ?? 1,
        ],
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
  return {
    factionId: mow.faction,
    alliance: mow.alliance,
    progression: progressionIndex(record.progressionIndex),
    // Machines of War have no rank; they tie on it and fall through to name.
    rank: -1,
    unlock: -1,
    unit: {
      kind: "mow",
      unitId: mow.id,
      name,
      data: {
        state: "owned",
        progression: record.progressionIndex,
        // Primary ability first, then secondary.
        abilityLevels: [
          record.abilities[0]?.level ?? 1,
          record.abilities[1]?.level ?? 1,
        ],
        shards: record.shards,
        mythicShards: record.mythicShards,
      },
    },
  }
}

function unownedRow(
  kind: UnitKind,
  unit: { id: UnitId; faction: string; alliance: Alliance },
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
    progression: -1,
    rank: -1,
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
