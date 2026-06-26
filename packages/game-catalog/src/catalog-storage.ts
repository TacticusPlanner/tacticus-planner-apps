import { openDB, type IDBPDatabase } from "idb"

import {
  catalogManifestBodyKey,
  catalogManifestMetadataKey,
  servedDatasetKeys,
  type CatalogDatasetKey,
  type CatalogDatasetMetadata,
  type CatalogManifest,
  type StoredCatalogManifest,
} from "./types"
import type { CatalogRecordByKey } from "./schemas"

export type CatalogStoredRecord = {
  id: string
  [key: string]: unknown
}

// A stored row: the validated record for the dataset plus the storage-managed string id.
export type StoredRecord<K extends CatalogDatasetKey> =
  CatalogRecordByKey[K] & {
    id: string
  }

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

// The mow upgrade-cost ladder has no natural id; key each level by its (zero-padded, so getAll returns
// them in ladder order) index.
function laddered(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((row, index) => ({
    id: String(index).padStart(4, "0"),
    ...row,
  }))
}

const datasetToRecords: Record<CatalogDatasetKey, DatasetToRecords> = {
  characters: asArray,
  npcs: asArray,
  mows: asArray,
  "mow-upgrade-costs": laddered,
  upgrades: asArray,
  equipment: asArray,
  "campaign-battles": asArray,
  "campaign-definitions": groupsWithId,
  lres: asArray,
}

export async function openCatalogDb() {
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

export async function getCatalogMetadata() {
  const db = await openCatalogDb()

  try {
    const values = (await db.getAll(metadataStore)) as CatalogDatasetMetadata[]

    return new Map(values.map((metadata) => [metadata.key, metadata]))
  } finally {
    db.close()
  }
}

export function getManifestMetadata(
  metadata: ReadonlyMap<string, CatalogDatasetMetadata>
) {
  return metadata.get(catalogManifestMetadataKey)
}

export async function hasCompleteCatalogCache() {
  const metadata = await getCatalogMetadata()

  return servedDatasetKeys.every((datasetKey) => metadata.has(datasetKey))
}

/**
 * Replaces a changed dataset on re-sync: empties its store (`clear()` — full wipe, no merge) and re-adds
 * all records, plus its metadata, in one transaction. Stale rows are removed.
 */
export async function replaceCatalogDataset(
  datasetKey: CatalogDatasetKey,
  data: unknown,
  metadata: CatalogDatasetMetadata
) {
  const records = datasetToRecords[datasetKey](data).map(toStoredRecord)

  const db = await openCatalogDb()
  const transaction = db.transaction([datasetKey, metadataStore], "readwrite")

  await transaction.objectStore(datasetKey).clear()

  for (const record of records) {
    await transaction.objectStore(datasetKey).put(record)
  }

  await transaction.objectStore(metadataStore).put(metadata)

  await transaction.done
  db.close()
}

export async function saveManifestMetadata(metadata: CatalogDatasetMetadata) {
  const db = await openCatalogDb()

  try {
    await db.put(metadataStore, metadata)
  } finally {
    db.close()
  }
}

/** Persists the full manifest body in the metadata store (for inspection / offline diffing). */
export async function saveStoredManifest(manifest: CatalogManifest) {
  const db = await openCatalogDb()
  const entry: StoredCatalogManifest = {
    key: catalogManifestBodyKey,
    manifest,
    updatedAt: new Date().toISOString(),
  }

  try {
    await db.put(metadataStore, entry)
  } finally {
    db.close()
  }
}

/** Reads the persisted manifest body, if any. */
export async function getStoredManifest(): Promise<
  CatalogManifest | undefined
> {
  const db = await openCatalogDb()

  try {
    const entry = (await db.get(metadataStore, catalogManifestBodyKey)) as
      | StoredCatalogManifest
      | undefined

    return entry?.manifest
  } finally {
    db.close()
  }
}

export async function getDatasetRecords<K extends CatalogDatasetKey>(
  datasetKey: K
): Promise<StoredRecord<K>[]> {
  const db = await openCatalogDb()

  try {
    return (await db.getAll(datasetKey)) as StoredRecord<K>[]
  } finally {
    db.close()
  }
}

export async function getDatasetRecord<K extends CatalogDatasetKey>(
  datasetKey: K,
  id: string
): Promise<StoredRecord<K> | undefined> {
  const db = await openCatalogDb()

  try {
    return (await db.get(datasetKey, id)) as StoredRecord<K> | undefined
  } finally {
    db.close()
  }
}

export async function clearCatalogDb() {
  const db = await openCatalogDb()
  const storeNames = [metadataStore, ...servedDatasetKeys]
  const transaction = db.transaction(storeNames, "readwrite")

  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear()
  }

  await transaction.done
  db.close()
}

function toStoredRecord(item: Record<string, unknown>): CatalogStoredRecord {
  const id = item.id

  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Catalog records must include a string or numeric id.")
  }

  return { ...item, id: String(id) }
}

export type CatalogDb = IDBPDatabase
