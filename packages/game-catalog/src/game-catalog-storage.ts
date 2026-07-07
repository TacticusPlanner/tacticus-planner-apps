import { openDB, type IDBPDatabase } from "idb"

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

// Named aliases for the datasets consumers most commonly read via `useDatasetRecords`/
// `getDatasetRecords`, so call sites can name the record type instead of re-deriving it from
// `StoredRecord<"...">` each time.
export type CharacterRecord = StoredRecord<"characters">
export type UpgradeRecord = StoredRecord<"upgrades">
export type CampaignBattleRecord = StoredRecord<"campaign-battles">
export type CampaignDefinitionRecord = StoredRecord<"campaign-definitions">

// Exported (not just for internal use) so tests can set up a raw IndexedDB connection at the exact
// name/version the app uses — e.g. to reproduce a store missing at the current version, see
// game-catalog-sync.test.ts's self-healing regression test.
export const catalogDbName = "tacticus-planner-game-catalog"
// v3: drop the old per-record indexes (searchText + field indexes) and the shared "extras" store; every
// served dataset is a plain id-keyed store. Reference tables are inlined or split into their own dataset.
export const catalogDbVersion = 3
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

function upgradeGameCatalogDb(db: IDBPDatabase) {
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
}

function hasAllRequiredStores(db: IDBPDatabase): boolean {
  return (
    db.objectStoreNames.contains(metadataStore) &&
    servedDatasetKeys.every((key) => db.objectStoreNames.contains(key))
  )
}

async function openAtDeclaredVersion(): Promise<IDBPDatabase> {
  try {
    return await openDB(catalogDbName, catalogDbVersion, {
      upgrade: upgradeGameCatalogDb,
    })
  } catch (error) {
    // A previous self-heal (below) may have already bumped the stored version past
    // `catalogDbVersion` — requesting the (now stale) declared version throws a VersionError rather
    // than downgrading. Attach at whatever version is already there instead of failing.
    if (error instanceof DOMException && error.name === "VersionError") {
      return openDB(catalogDbName)
    }

    throw error
  }
}

/**
 * Opens the catalog DB, self-healing if a required store is missing even though the DB is already at
 * `catalogDbVersion` — this happens whenever a dataset is added to `servedDatasetKeys` without a
 * matching version bump (an easy mistake, and the exact cause of a real bug: a client stuck at the
 * old version silently failed to sync forever because a newly-added dataset's store never got
 * created, see the `game-catalog-sync` header comment). Rather than relying on every future addition
 * to remember to bump `catalogDbVersion`, detect the mismatch here and reopen one version higher —
 * `upgradeGameCatalogDb` unconditionally creates any missing store, so this always converges (and
 * `openAtDeclaredVersion` makes every later open work again once the stored version has moved past
 * the hardcoded constant).
 */
async function openGameCatalogDb() {
  const db = await openAtDeclaredVersion()

  if (hasAllRequiredStores(db)) {
    return db
  }

  const healedVersion = db.version + 1
  db.close()

  return openDB(catalogDbName, healedVersion, {
    upgrade: upgradeGameCatalogDb,
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

function toStoredRecord<T extends Record<string, unknown>>(
  item: T
): T & { id: string } {
  const id = item.id

  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("GameCatalog records must include a string or numeric id.")
  }

  return { ...item, id: String(id) }
}
