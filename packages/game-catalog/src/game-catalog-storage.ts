import Dexie, { type EntityTable } from "dexie"

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
export const catalogDbVersion = 4

// One EntityTable per served dataset, keyed by "id" — computed from the same union that builds the
// stores below (GameCatalogDatasetKey === typeof servedDatasetKeys[number]), so every dataset store is
// properly typed without hand-declaring one property per dataset (11 of them).
type GameCatalogTables = {
  [K in GameCatalogDatasetKey]: EntityTable<StorageModel<K>, "id">
}

type GameCatalogDb = Dexie &
  GameCatalogTables & {
    metadata: EntityTable<GameCatalogDatasetMetadata, "key">
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
const catalogDb = new Dexie(catalogDbName) as GameCatalogDb

catalogDb.version(3).stores({
  metadata: "key",
  ...Object.fromEntries(
    servedDatasetKeys
      .filter((key) => key !== "onslaught-rewards")
      .map((key) => [key, "id"])
  ),
})

catalogDb.version(catalogDbVersion).stores({
  metadata: "key",
  ...Object.fromEntries(servedDatasetKeys.map((key) => [key, "id"])),
})

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
export async function replaceGameCatalogDataset<
  K extends GameCatalogDatasetKey,
>(datasetKey: K, data: unknown, metadata: GameCatalogDatasetMetadata) {
  // datasetToStorageModels is a shape-agnostic, runtime-key-dispatched transform (it returns
  // Record<string, unknown>[] since it has no way to know its own dataset's specific shape at the
  // type level) — this single cast is the honest boundary where the payload, already validated by
  // datasetPayloadSchemas[datasetKey] (see game-catalog-api.ts), enters the typed store.
  const records = datasetToStorageModels[datasetKey](data).map(
    mapDatasetRowToStorageModel
  ) as StorageModel<K>[]

  // Bracket access on `catalogDb` (typed via the `GameCatalogTables` mapped type above) does not
  // collapse to a single `EntityTable<StorageModel<K>, "id">` for a still-generic `K` — TS distributes
  // it into a union across every dataset key instead, which then won't assign to `StorageModel<K>[]`.
  // Dexie's own `.table<T, TKey>()` overload takes its type arguments explicitly rather than inferring
  // through the intersection, so it collapses correctly here; it's the same accessor `getDatasetRecords`
  // below uses.
  const table = catalogDb.table<StorageModel<K>, string>(datasetKey)

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
