import { openDB, type IDBPDatabase } from "idb"

import {
  catalogManifestMetadataKey,
  servedDatasetKeys,
  type CatalogDatasetKey,
  type CatalogDatasetMetadata,
} from "./types"
import type { CatalogRecordByKey } from "./schemas"
import type {
  CatalogEquipmentUpgradeCost,
  CatalogMowUpgradeCost,
} from "./record-types"

export type CatalogStoredRecord = {
  id: string
  searchText: string
  [key: string]: unknown
}

// A stored row: the validated record for the dataset plus the storage-managed id/searchText fields.
export type StoredRecord<K extends CatalogDatasetKey> =
  CatalogRecordByKey[K] & {
    id: string
    searchText: string
  }

// Dataset-level shared tables (extras), typed per dataset (only the wrapper datasets have them).
export type CatalogExtrasByKey = {
  characters: undefined
  npcs: undefined
  mows: { upgradeCosts: CatalogMowUpgradeCost[] }
  upgrades: undefined
  equipment: { upgradeCostsByRarity: CatalogEquipmentUpgradeCost[] }
  "campaign-battles": undefined
  lres: undefined
}

const catalogDbName = "tacticus-planner-catalog"
// v2: server-side denormalized datasets replace the old per-faction/per-type chunk stores.
const catalogDbVersion = 2
const metadataStore = "metadata"
const extrasStore = "extras"

type DatasetAdapter = {
  // Indexed fields (booleans are intentionally excluded — not valid IndexedDB keys).
  indexes: readonly string[]
  // Maps the dataset envelope `data` into the rows stored per record.
  toRecords: (data: unknown) => Record<string, unknown>[]
  // Maps the envelope `data` into the dataset-level shared tables, if any (e.g. cost ladders).
  toExtras?: (data: unknown) => Record<string, unknown> | undefined
}

function asArray(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : []
}

function wrappedItems(data: unknown): Record<string, unknown>[] {
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: Record<string, unknown>[] }).items
  }

  return []
}

function extrasExceptItems(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") {
    return undefined
  }

  const rest: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (key !== "items") {
      rest[key] = value
    }
  }

  return Object.keys(rest).length > 0 ? rest : undefined
}

// campaign-battles groups key on `groupId`; everything else already carries an `id`.
function groupsWithId(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((group) => ({ id: group.groupId, ...group }))
}

const datasetAdapters: Record<CatalogDatasetKey, DatasetAdapter> = {
  characters: {
    indexes: ["faction", "alliance", "initialRarity"],
    toRecords: asArray,
  },
  npcs: { indexes: [], toRecords: asArray },
  mows: {
    indexes: ["faction", "alliance", "unitKind"],
    toRecords: wrappedItems,
    toExtras: extrasExceptItems,
  },
  upgrades: { indexes: ["rarity", "stat"], toRecords: asArray },
  equipment: {
    indexes: ["rarity", "type"],
    toRecords: wrappedItems,
    toExtras: extrasExceptItems,
  },
  "campaign-battles": {
    indexes: ["faction", "releaseType"],
    toRecords: groupsWithId,
  },
  lres: { indexes: ["unitSnowprintId"], toRecords: asArray },
}

export async function openCatalogDb() {
  return openDB(catalogDbName, catalogDbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(metadataStore)) {
        db.createObjectStore(metadataStore, { keyPath: "key" })
      }

      if (!db.objectStoreNames.contains(extrasStore)) {
        db.createObjectStore(extrasStore, { keyPath: "key" })
      }

      // Drop stores that are no longer part of the served catalog (e.g. the old v1 chunk stores).
      for (const name of Array.from(db.objectStoreNames)) {
        if (
          name !== metadataStore &&
          name !== extrasStore &&
          !(servedDatasetKeys as readonly string[]).includes(name)
        ) {
          db.deleteObjectStore(name)
        }
      }

      for (const datasetKey of servedDatasetKeys) {
        if (db.objectStoreNames.contains(datasetKey)) {
          continue
        }

        const store = db.createObjectStore(datasetKey, { keyPath: "id" })

        store.createIndex("searchText", "searchText")

        for (const index of datasetAdapters[datasetKey].indexes) {
          store.createIndex(index, index)
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
 * all records, plus optional shared tables and metadata, in one transaction. Stale rows are removed.
 */
export async function replaceCatalogDataset(
  datasetKey: CatalogDatasetKey,
  data: unknown,
  metadata: CatalogDatasetMetadata
) {
  const adapter = datasetAdapters[datasetKey]
  const records = adapter.toRecords(data).map(toStoredRecord)
  const extras = adapter.toExtras?.(data)

  const db = await openCatalogDb()
  const transaction = db.transaction(
    [datasetKey, metadataStore, extrasStore],
    "readwrite"
  )

  await transaction.objectStore(datasetKey).clear()

  for (const record of records) {
    await transaction.objectStore(datasetKey).put(record)
  }

  await transaction.objectStore(metadataStore).put(metadata)

  if (extras) {
    await transaction.objectStore(extrasStore).put({ key: datasetKey, extras })
  }

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

export async function searchDataset<K extends CatalogDatasetKey>(
  datasetKey: K,
  term: string
): Promise<StoredRecord<K>[]> {
  const records = await getDatasetRecords(datasetKey)
  const needle = term.trim().toLocaleLowerCase()

  if (!needle) {
    return records
  }

  return records.filter((record) => record.searchText.includes(needle))
}

export async function getDatasetExtras<K extends CatalogDatasetKey>(
  datasetKey: K
): Promise<CatalogExtrasByKey[K] | undefined> {
  const db = await openCatalogDb()

  try {
    const entry = (await db.get(extrasStore, datasetKey)) as
      | { key: string; extras: CatalogExtrasByKey[K] }
      | undefined

    return entry?.extras
  } finally {
    db.close()
  }
}

export async function clearCatalogDb() {
  const db = await openCatalogDb()
  const storeNames = [metadataStore, extrasStore, ...servedDatasetKeys]
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

  return {
    ...item,
    id: String(id),
    searchText: normalizeSearchText(item),
  }
}

function normalizeSearchText(value: unknown): string {
  const terms: string[] = []

  collectSearchTerms(value, terms)

  return terms.join(" ").toLocaleLowerCase()
}

function collectSearchTerms(value: unknown, terms: string[]) {
  if (value === null || value === undefined) {
    return
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    terms.push(String(value))
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSearchTerms(item, terms)
    }

    return
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectSearchTerms(nested, terms)
    }
  }
}

export type CatalogDb = IDBPDatabase
