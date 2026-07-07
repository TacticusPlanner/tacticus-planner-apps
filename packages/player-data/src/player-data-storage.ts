import { openDB, type IDBPDatabase } from "idb"

import {
  isSplitPlayerDataChunkKey,
  playerDataChunkKeys,
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
  type SplitPlayerDataChunkKey,
} from "./chunk-keys"
import type { PlayerDataChunkPayload, PlayerDataMetadata } from "./types"

// Exported (not just for internal use) so tests can set up a raw IndexedDB connection at the exact
// name/version the app uses — mirrors @workspace/game-catalog's storage layer.
export const playerDataDbName = "tacticus-planner-player-data"
export const playerDataDbVersion = 1
const metadataStore = "metadata"

/**
 * Most player-data chunks are a list of records with a natural per-record identity — those are
 * stored as one row per record (keyed by that identity), mirroring @workspace/game-catalog's
 * id-keyed dataset stores; see `splitPlayerDataChunkKeys` in chunk-keys.ts. Campaign identity has no
 * single natural id field, so it uses a compound key instead of injecting a synthetic one. The
 * remaining chunks (`player-details`, `inventory`, `live-progress`) are singleton objects that don't
 * split cleanly, so they stay a single whole-payload row, stored with an out-of-line key equal to
 * the chunk key itself (as before).
 */
// Exported so tests can seed a raw IndexedDB connection with the exact same per-store schema this
// module uses (see game-catalog-sync.test.ts's analogous self-healing regression test).
export const splitChunkKeyPath: Record<
  SplitPlayerDataChunkKey,
  string | string[]
> = {
  characters: "unitId",
  mows: "unitId",
  "inventory-upgrades": "upgradeId",
  "inventory-items": "itemId",
  "campaign-progress": ["tacticusCampaignId", "type"],
  "campaign-events-progress": ["tacticusCampaignId", "type"],
  "lre-progress": "id",
}

function upgradePlayerDataDb(db: IDBPDatabase) {
  if (!db.objectStoreNames.contains(metadataStore)) {
    db.createObjectStore(metadataStore, { keyPath: "key" })
  }

  for (const chunkKey of playerDataChunkKeys) {
    if (db.objectStoreNames.contains(chunkKey)) {
      continue
    }

    if (isSplitPlayerDataChunkKey(chunkKey)) {
      db.createObjectStore(chunkKey, { keyPath: splitChunkKeyPath[chunkKey] })
    } else {
      db.createObjectStore(chunkKey)
    }
  }
}

function hasAllRequiredStores(db: IDBPDatabase): boolean {
  return (
    db.objectStoreNames.contains(metadataStore) &&
    playerDataChunkKeys.every((chunkKey) =>
      db.objectStoreNames.contains(chunkKey)
    )
  )
}

async function openAtDeclaredVersion(): Promise<IDBPDatabase> {
  try {
    return await openDB(playerDataDbName, playerDataDbVersion, {
      upgrade: upgradePlayerDataDb,
    })
  } catch (error) {
    // A previous self-heal (below) may have already bumped the stored version past
    // `playerDataDbVersion` — requesting the (now stale) declared version throws a VersionError
    // rather than downgrading. Attach at whatever version is already there instead of failing.
    if (error instanceof DOMException && error.name === "VersionError") {
      return openDB(playerDataDbName)
    }

    throw error
  }
}

/**
 * Opens the player-data DB, self-healing if a required store is missing even though the DB is
 * already at `playerDataDbVersion` — mirrors @workspace/game-catalog's storage layer (see its header
 * comment for the real bug this guards against): a chunk key added later without a matching version
 * bump would otherwise wedge every sync for existing clients forever.
 */
async function openPlayerDataDb() {
  const db = await openAtDeclaredVersion()

  if (hasAllRequiredStores(db)) {
    return db
  }

  const healedVersion = db.version + 1
  db.close()

  return openDB(playerDataDbName, healedVersion, {
    upgrade: upgradePlayerDataDb,
  })
}

export async function getPlayerDataMetadata() {
  const db = await openPlayerDataDb()

  try {
    const values = (await db.getAll(metadataStore)) as PlayerDataMetadata[]

    return new Map(values.map((metadata) => [metadata.key, metadata]))
  } finally {
    db.close()
  }
}

export function getManifestMetadata(
  metadata: ReadonlyMap<string, PlayerDataMetadata>
) {
  return metadata.get(playerDataManifestMetadataKey)
}

export async function hasCompletePlayerDataCache() {
  const metadata = await getPlayerDataMetadata()

  return playerDataChunkKeys.every((chunkKey) => metadata.has(chunkKey))
}

/**
 * Replaces a changed chunk on re-sync, in one transaction: for a split chunk, empties its store
 * (`clear()` — full wipe, no merge) and re-adds every record; for a singleton chunk, overwrites its
 * single stored row. Always also writes the chunk's metadata row. `data` is `unknown` here (already
 * zod-validated by the caller against the matching per-chunk schema) so the sync loop — which is
 * necessarily heterogeneous across chunk keys — doesn't need an unsound cast to call this;
 * `getChunkData`/`getChunkRecord` below are the typed read side.
 */
export async function replacePlayerDataChunk(
  chunkKey: PlayerDataChunkKey,
  data: unknown,
  metadata: PlayerDataMetadata
) {
  const db = await openPlayerDataDb()

  try {
    const transaction = db.transaction([chunkKey, metadataStore], "readwrite")
    const store = transaction.objectStore(chunkKey)

    if (isSplitPlayerDataChunkKey(chunkKey)) {
      await store.clear()

      for (const record of Array.isArray(data) ? data : []) {
        await store.put(record)
      }
    } else {
      await store.put(data, chunkKey)
    }

    await transaction.objectStore(metadataStore).put(metadata)

    await transaction.done
  } finally {
    // Without this, a mid-transaction failure (e.g. a record missing its keyPath field) leaks an open
    // connection — which then blocks any later version-bumping open (including the self-heal path
    // above) until the tab/process closes.
    db.close()
  }
}

export async function saveManifestMetadata(metadata: PlayerDataMetadata) {
  const db = await openPlayerDataDb()

  try {
    await db.put(metadataStore, metadata)
  } finally {
    db.close()
  }
}

/**
 * Reads a whole chunk's payload, reassembled from its per-record rows for a split chunk. Returns
 * `undefined` if the chunk has never been synced — determined via its metadata row rather than
 * "store is empty", since a split chunk that *has* synced can legitimately hold zero records (e.g. a
 * player with no MoWs), which must still read back as `[]`, not `undefined`.
 */
export async function getChunkData<K extends PlayerDataChunkKey>(
  chunkKey: K
): Promise<PlayerDataChunkPayload<K> | undefined> {
  const db = await openPlayerDataDb()

  try {
    const chunkMetadata = await db.get(metadataStore, chunkKey)

    if (!chunkMetadata) {
      return undefined
    }

    if (isSplitPlayerDataChunkKey(chunkKey)) {
      return (await db.getAll(chunkKey)) as PlayerDataChunkPayload<K>
    }

    return (await db.get(chunkKey, chunkKey)) as
      PlayerDataChunkPayload<K> | undefined
  } finally {
    db.close()
  }
}

/**
 * Reads a single record from a split chunk's store by its natural id (a plain string for most split
 * chunks, or the `[tacticusCampaignId, type]` pair for the two campaign-progress chunks) — the
 * cheaper alternative to `getChunkData` when only one record is actually needed (e.g. Character
 * Lookup's single selected character), mirroring @workspace/game-catalog's `getDatasetRecord`.
 */
export async function getChunkRecord<K extends SplitPlayerDataChunkKey>(
  chunkKey: K,
  id: string | readonly string[]
): Promise<PlayerDataChunkPayload<K>[number] | undefined> {
  const db = await openPlayerDataDb()

  try {
    return (await db.get(chunkKey, id as string | string[])) as
      PlayerDataChunkPayload<K>[number] | undefined
  } finally {
    db.close()
  }
}

export async function clearPlayerDataDb() {
  const db = await openPlayerDataDb()
  const storeNames = [metadataStore, ...playerDataChunkKeys]
  const transaction = db.transaction(storeNames, "readwrite")

  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear()
  }

  await transaction.done
  db.close()
}
