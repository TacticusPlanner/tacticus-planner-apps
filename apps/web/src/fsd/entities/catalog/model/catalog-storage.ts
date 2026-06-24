import { openDB, type IDBPDatabase } from "idb"

import {
  catalogDatasetKeys,
  catalogManifestMetadataKey,
  type CatalogDatasetKey,
  type CatalogDatasetMetadata,
} from "./catalog-sync"

export type CatalogStoredRecord = {
  id: string
  searchText: string
  [key: string]: unknown
}

const catalogDbName = "tacticus-planner-catalog"
const catalogDbVersion = 1
const metadataStore = "metadata"

const datasetIndexes: Record<CatalogDatasetKey, readonly string[]> = {
  "campaign-battles": ["campaign", "campaignType"],
  "campaign-events": ["faction", "groupType", "difficulty"],
  campaigns: ["faction", "groupType", "difficulty"],
  equipment: ["rarity", "type"],
  lres: ["unitSnowprintId", "finished"],
  mows: ["faction", "alliance"],
  units: ["faction", "alliance", "unitKind"],
  upgrades: ["rarity", "stat"],
}

export async function openCatalogDb() {
  return openDB(catalogDbName, catalogDbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(metadataStore)) {
        db.createObjectStore(metadataStore, { keyPath: "key" })
      }

      for (const datasetKey of catalogDatasetKeys) {
        if (db.objectStoreNames.contains(datasetKey)) {
          continue
        }

        const store = db.createObjectStore(datasetKey, { keyPath: "id" })

        store.createIndex("searchText", "searchText")

        for (const index of datasetIndexes[datasetKey]) {
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

export async function hasCompleteCatalogCache() {
  const metadata = await getCatalogMetadata()

  return catalogDatasetKeys.every((datasetKey) => metadata.has(datasetKey))
}

export async function replaceCatalogDataset(
  datasetKey: CatalogDatasetKey,
  items: readonly Record<string, unknown>[],
  metadata: CatalogDatasetMetadata
) {
  const db = await openCatalogDb()
  const transaction = db.transaction([datasetKey, metadataStore], "readwrite")
  const store = transaction.objectStore(datasetKey)

  await store.clear()

  for (const item of items) {
    await store.put(toStoredRecord(item))
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

export async function getDatasetRecords(datasetKey: CatalogDatasetKey) {
  const db = await openCatalogDb()

  try {
    return (await db.getAll(datasetKey)) as CatalogStoredRecord[]
  } finally {
    db.close()
  }
}

export async function clearCatalogDb() {
  const db = await openCatalogDb()
  const storeNames = [metadataStore, ...catalogDatasetKeys]
  const transaction = db.transaction(storeNames, "readwrite")

  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear()
  }

  await transaction.done
  db.close()
}

export function getManifestMetadata(
  metadata: ReadonlyMap<string, CatalogDatasetMetadata>
) {
  return metadata.get(catalogManifestMetadataKey)
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
