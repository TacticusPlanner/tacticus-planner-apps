import { openDB } from "idb"

import {
  catalogManifestMetadataKey,
  servedDatasetKeys,
  type GameCatalogDatasetKey,
  type GameCatalogDatasetMetadata,
} from "./types"
import type { GameCatalogRecordByKey } from "./schemas"

export type GameCatalogStoredRecord = {
  id: string
  [key: string]: unknown
}

// A stored row: the validated record for the dataset plus the storage-managed string id.
export type StoredRecord<K extends GameCatalogDatasetKey> =
  GameCatalogRecordByKey[K] & {
    id: string
  }

// Named aliases for the datasets consumers most commonly read via `useDatasetRecords`/
// `getDatasetRecords`, so call sites can name the record type instead of re-deriving it from
// `StoredRecord<"...">` each time.
export type CharacterRecord = StoredRecord<"characters">
export type UpgradeRecord = StoredRecord<"upgrades">
export type CampaignBattleRecord = StoredRecord<"campaign-battles">
export type CampaignDefinitionRecord = StoredRecord<"campaign-definitions">

const catalogDbName = "tacticus-planner-game-catalog"
// v3: drop the old per-record indexes (searchText + field indexes) and the shared "extras" store; every
// served dataset is a plain id-keyed store. Reference tables are inlined or split into their own dataset.
const catalogDbVersion = 3
const metadataStore = "metadata"

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

async function openGameCatalogDb() {
  return openDB(catalogDbName, catalogDbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(metadataStore)) {
        db.createObjectStore(metadataStore, { keyPath: "key" })
      }

      // Drop any store that is no longer part of the served catalog (old chunk/extras stores, or a
      // dataset store carrying the old indexed schema — recreated below without indexes).
      for (const name of Array.from(db.objectStoreNames)) {
        if (
          name !== metadataStore &&
          !(servedDatasetKeys as readonly string[]).includes(name)
        ) {
          db.deleteObjectStore(name)
        }
      }

      for (const datasetKey of servedDatasetKeys) {
        if (!db.objectStoreNames.contains(datasetKey)) {
          db.createObjectStore(datasetKey, { keyPath: "id" })
        }
      }
    },
  })
}

export async function getGameCatalogMetadata() {
  const db = await openGameCatalogDb()

  try {
    const values = (await db.getAll(
      metadataStore
    )) as GameCatalogDatasetMetadata[]

    return new Map(values.map((metadata) => [metadata.key, metadata]))
  } finally {
    db.close()
  }
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

  const db = await openGameCatalogDb()
  const transaction = db.transaction([datasetKey, metadataStore], "readwrite")

  await transaction.objectStore(datasetKey).clear()

  for (const record of records) {
    await transaction.objectStore(datasetKey).put(record)
  }

  await transaction.objectStore(metadataStore).put(metadata)

  await transaction.done
  db.close()
}

export async function saveManifestMetadata(
  metadata: GameCatalogDatasetMetadata
) {
  const db = await openGameCatalogDb()

  try {
    await db.put(metadataStore, metadata)
  } finally {
    db.close()
  }
}

export async function getDatasetRecords<K extends GameCatalogDatasetKey>(
  datasetKey: K
): Promise<StoredRecord<K>[]> {
  const db = await openGameCatalogDb()

  try {
    return (await db.getAll(datasetKey)) as StoredRecord<K>[]
  } finally {
    db.close()
  }
}

export async function getDatasetRecord<K extends GameCatalogDatasetKey>(
  datasetKey: K,
  id: string
): Promise<StoredRecord<K> | undefined> {
  const db = await openGameCatalogDb()

  try {
    return (await db.get(datasetKey, id)) as StoredRecord<K> | undefined
  } finally {
    db.close()
  }
}

export async function clearGameCatalogDb() {
  const db = await openGameCatalogDb()
  const storeNames = [metadataStore, ...servedDatasetKeys]
  const transaction = db.transaction(storeNames, "readwrite")

  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear()
  }

  await transaction.done
  db.close()
}

function toStoredRecord(
  item: Record<string, unknown>
): GameCatalogStoredRecord {
  const id = item.id

  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("GameCatalog records must include a string or numeric id.")
  }

  return { ...item, id: String(id) }
}
