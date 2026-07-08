import Dexie, { type Table } from "dexie"

import {
  catalogManifestMetadataKey,
  servedDatasetKeys,
  type GameCatalogDatasetKey,
  type GameCatalogDatasetMetadata,
} from "./types"
import type { GameCatalogRecordByKey } from "./schemas"

// A stored row: the validated record for the dataset plus the storage-managed string id.
export type StoredRecord<K extends GameCatalogDatasetKey> =
  GameCatalogRecordByKey[K] & {
    id: string
  }

// Named aliases for the datasets consumers most commonly read via `@workspace/game-catalog/queries`,
// so call sites can name the record type instead of re-deriving it from `StoredRecord<"...">` each
// time.
export type CharacterRecord = StoredRecord<"characters">
export type UpgradeRecord = StoredRecord<"upgrades">
export type CampaignBattleRecord = StoredRecord<"campaign-battles">
export type CampaignDefinitionRecord = StoredRecord<"campaign-definitions">

export const catalogDbName = "tacticus-planner-game-catalog"
// v3: drop the old per-record indexes (searchText + field indexes) and the shared "extras" store; every
// served dataset is a plain id-keyed store. Reference tables are inlined or split into their own dataset.
export const catalogDbVersion = 3

// Maps a dataset envelope's `data` (always a plain array now) into the id-keyed rows stored per record.
type DatasetToRecords = (data: unknown) => Record<string, unknown>[]

function asArray(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : []
}

// campaign-definitions key on `groupId`; everything else already carries an `id`.
function groupsWithId(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((group) => ({ id: group.groupId, ...group }))
}

// The mow upgrade-cost ladder is keyed by the ability level it raises a MoW to (server-provided), so the
// store id correlates with the in-game level rather than an opaque array index.
function byLevel(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((row) => ({ id: row.level, ...row }))
}

const datasetToRecords: Record<GameCatalogDatasetKey, DatasetToRecords> = {
  characters: asArray,
  npcs: asArray,
  mows: asArray,
  "mow-upgrade-costs": byLevel,
  upgrades: asArray,
  equipment: asArray,
  "campaign-battles": asArray,
  "campaign-definitions": groupsWithId,
  lres: asArray,
  "lre-battles": asArray,
  "lre-common": asArray,
}

/**
 * Single long-lived Dexie instance for the whole app's lifetime — idiomatic Dexie usage (repeatedly
 * closing/reopening a connection defeats its internal optimizations and is explicitly discouraged).
 * One complete `.version().stores()` block: this is greenfield (nothing has shipped), so there's no
 * historical version chain to replay. Dexie's own version-cascade upgrade mechanism — each version
 * declares its *complete* store list, and Dexie walks any older client through every version up to the
 * latest — is what future dataset additions should rely on (bump `catalogDbVersion`, add a new
 * `.version(N+1).stores({...})` block here), not a custom self-heal workaround: this replaces the
 * previous hand-rolled "detect a missing store and reopen one version higher" logic entirely.
 */
class GameCatalogDb extends Dexie {
  metadata!: Table<GameCatalogDatasetMetadata, string>

  constructor() {
    super(catalogDbName)

    this.version(catalogDbVersion).stores({
      metadata: "key",
      ...Object.fromEntries(servedDatasetKeys.map((key) => [key, "id"])),
    })
  }
}

const catalogDb = new GameCatalogDb()

export async function getGameCatalogMetadata() {
  const values = await catalogDb.metadata.toArray()

  return new Map(values.map((metadata) => [metadata.key, metadata]))
}

export function getManifestMetadata(
  metadata: ReadonlyMap<string, GameCatalogDatasetMetadata>
) {
  return metadata.get(catalogManifestMetadataKey)
}

export async function hasCompleteGameCatalogCache() {
  const metadata = await getGameCatalogMetadata()

  return servedDatasetKeys.every((datasetKey) => metadata.has(datasetKey))
}

/**
 * Replaces a changed dataset on re-sync: empties its store (`clear()` — full wipe, no merge) and re-adds
 * all records, plus its metadata, in one transaction. Stale rows are removed.
 */
export async function replaceGameCatalogDataset(
  datasetKey: GameCatalogDatasetKey,
  data: unknown,
  metadata: GameCatalogDatasetMetadata
) {
  const records = datasetToRecords[datasetKey](data).map(toStoredRecord)
  const table = catalogDb.table(datasetKey)

  await catalogDb.transaction("rw", table, catalogDb.metadata, async () => {
    await table.clear()
    await table.bulkPut(records)
    await catalogDb.metadata.put(metadata)
  })
}

export async function saveManifestMetadata(
  metadata: GameCatalogDatasetMetadata
) {
  await catalogDb.metadata.put(metadata)
}

export async function getDatasetRecords<K extends GameCatalogDatasetKey>(
  datasetKey: K
): Promise<StoredRecord<K>[]> {
  return catalogDb.table<StoredRecord<K>, string>(datasetKey).toArray()
}

export async function clearGameCatalogDb() {
  await catalogDb.transaction(
    "rw",
    ["metadata", ...servedDatasetKeys],
    async () => {
      await catalogDb.metadata.clear()
      await Promise.all(
        servedDatasetKeys.map((key) => catalogDb.table(key).clear())
      )
    }
  )
}

function toStoredRecord<T extends Record<string, unknown>>(
  item: T
): T & { id: string } {
  const id = item.id

  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("GameCatalog records must include a string or numeric id.")
  }

  return { ...item, id: String(id) }
}
