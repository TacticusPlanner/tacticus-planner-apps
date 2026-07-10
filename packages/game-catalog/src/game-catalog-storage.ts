import Dexie, { type Table } from "dexie"

import {
  catalogManifestMetadataKey,
  servedDatasetKeys,
  type GameCatalogDatasetKey,
  type GameCatalogDatasetMetadata,
} from "./types"
import {
  datasetToStorageModels,
  mapDatasetRowToStorageModel,
} from "./game-catalog.mapper"
import type { StorageModel } from "./game-catalog.storage"

export const catalogDbName = "tacticus-planner-game-catalog"
// v3: drop the old per-record indexes (searchText + field indexes) and the shared "extras" store; every
// served dataset is a plain id-keyed store. Reference tables are inlined or split into their own dataset.
export const catalogDbVersion = 3

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
  const records = datasetToStorageModels[datasetKey](data).map(
    mapDatasetRowToStorageModel
  )
  // Typed the same way as getDatasetRecords' read path below (Dexie's `.table<T, TKey>()` overload)
  // rather than the untyped `.table(datasetKey)` lookup — `records` themselves are already only
  // typed as `Record<string, unknown>[]` (the per-dataset-key transform in `datasetToStorageModels`
  // above has no way to know its own dataset's specific shape at the type level), so this is as far
  // as this generic-over-`datasetKey` write path can be typed without hand-declaring one Dexie table
  // property per dataset (11 of them) purely to duplicate what `datasetToStorageModels`'s keys already
  // enumerate.
  const table = catalogDb.table<Record<string, unknown>, string>(datasetKey)

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
): Promise<StorageModel<K>[]> {
  return catalogDb.table<StorageModel<K>, string>(datasetKey).toArray()
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
