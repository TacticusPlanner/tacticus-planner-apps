import { openDB, type IDBPDatabase } from "idb"

import {
  isMergedPlayerDataChunkKey,
  isSplitPlayerDataChunkKey,
  playerDataChunkKeys,
  playerDataManifestMetadataKey,
  type MergedPlayerDataChunkKey,
  type PlayerDataChunkKey,
  type SplitPlayerDataChunkKey,
} from "./chunk-keys"
import type { PlayerDataChunkPayload, PlayerDataMetadata } from "./types"

// Exported (not just for internal use) so tests can set up a raw IndexedDB connection at the exact
// name/version the app uses — mirrors @workspace/game-catalog's storage layer.
export const playerDataDbName = "tacticus-planner-player-data"
export const playerDataDbVersion = 1
const metadataStore = "metadata"
// Shared by every "merged" chunk (see chunk-keys.ts) — holds several small records per chunk instead
// of giving each chunk its own single-row store.
const profileStore = "profile"

/**
 * Natural per-record key for each split chunk's own store (see `splitPlayerDataChunkKeys` in
 * chunk-keys.ts). Campaign identity has no single natural id field, so it uses a compound key instead
 * of injecting a synthetic one.
 *
 * Exported so tests can seed a raw IndexedDB connection with the exact same per-store schema this
 * module uses (see the self-healing regression test in player-data-sync.test.ts).
 */
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

function storeNameForChunk(chunkKey: PlayerDataChunkKey): string {
  return isMergedPlayerDataChunkKey(chunkKey) ? profileStore : chunkKey
}

// A range covering every `profile`-store row belonging to one merged chunk — every such row's id is
// prefixed `${chunkKey}:...`, so this both selects (getAll) and scopes a delete to exactly one
// chunk's rows without touching the other two chunks sharing the store.
function chunkKeyRange(chunkKey: string): IDBKeyRange {
  return IDBKeyRange.bound(`${chunkKey}:`, `${chunkKey}:\uFFFF`)
}

function withoutId<T extends { id: string }>(record: T): Omit<T, "id"> {
  const rest: Partial<T> = { ...record }
  delete rest.id
  return rest as Omit<T, "id">
}

/**
 * Decomposes one merged chunk's whole payload into the flat records stored in the shared `profile`
 * store: a "summary" record for the leftover scalars/small fixed-shape groups (requisition orders,
 * badges/orbs/components; the active event id, game-mode tokens) that have no natural per-item id
 * worth splitting on, plus one row per naturally-keyed sub-collection (shards, mythic shards, xp
 * books; battle attempts).
 */
function decomposeMergedChunk(
  chunkKey: MergedPlayerDataChunkKey,
  data: unknown
): Record<string, unknown>[] {
  switch (chunkKey) {
    case "player-details": {
      const details = data as PlayerDataChunkPayload<"player-details">
      return [{ id: "player-details:main", ...details }]
    }

    case "inventory": {
      const inventory = data as PlayerDataChunkPayload<"inventory">
      return [
        {
          id: "inventory:summary",
          abilityBadges: inventory.abilityBadges,
          components: inventory.components,
          forgeBadges: inventory.forgeBadges,
          orbs: inventory.orbs,
          requisitionOrdersRegular: inventory.requisitionOrdersRegular,
          requisitionOrdersBlessed: inventory.requisitionOrdersBlessed,
          resetStones: inventory.resetStones,
        },
        ...inventory.shards.map((shard) => ({
          id: `inventory:shard:${shard.unitId}`,
          ...shard,
        })),
        ...inventory.mythicShards.map((shard) => ({
          id: `inventory:mythicShard:${shard.unitId}`,
          ...shard,
        })),
        ...inventory.xpBooks.map((book) => ({
          id: `inventory:xpBook:${book.xpBookId}`,
          ...book,
        })),
      ]
    }

    case "live-progress": {
      const liveProgress = data as PlayerDataChunkPayload<"live-progress">
      return [
        {
          id: "live-progress:summary",
          activeCampaignEventId: liveProgress.activeCampaignEventId,
          gameModeTokens: liveProgress.gameModeTokens,
        },
        ...liveProgress.battleAttempts.map((battle) => ({
          id: `live-progress:battleAttempt:${battle.tacticusCampaignId}:${battle.battleIndex}`,
          ...battle,
        })),
      ]
    }
  }
}

/** Inverse of `decomposeMergedChunk`: reassembles one chunk's whole payload from the flat records a
 * range query returned for it. Returns `undefined` if there's no summary record (chunk never synced). */
function reassembleMergedChunk(
  chunkKey: MergedPlayerDataChunkKey,
  records: { id: string }[]
): unknown {
  switch (chunkKey) {
    case "player-details": {
      const record = records.find((r) => r.id === "player-details:main")
      return record ? withoutId(record) : undefined
    }

    case "inventory": {
      const summary = records.find((r) => r.id === "inventory:summary")

      if (!summary) {
        return undefined
      }

      return {
        ...withoutId(summary),
        shards: records
          .filter((r) => r.id.startsWith("inventory:shard:"))
          .map(withoutId),
        mythicShards: records
          .filter((r) => r.id.startsWith("inventory:mythicShard:"))
          .map(withoutId),
        xpBooks: records
          .filter((r) => r.id.startsWith("inventory:xpBook:"))
          .map(withoutId),
      }
    }

    case "live-progress": {
      const summary = records.find((r) => r.id === "live-progress:summary")

      if (!summary) {
        return undefined
      }

      return {
        ...withoutId(summary),
        battleAttempts: records
          .filter((r) => r.id.startsWith("live-progress:battleAttempt:"))
          .map(withoutId),
      }
    }
  }
}

function upgradePlayerDataDb(db: IDBPDatabase) {
  if (!db.objectStoreNames.contains(metadataStore)) {
    db.createObjectStore(metadataStore, { keyPath: "key" })
  }

  if (!db.objectStoreNames.contains(profileStore)) {
    db.createObjectStore(profileStore, { keyPath: "id" })
  }

  for (const chunkKey of playerDataChunkKeys) {
    if (!isSplitPlayerDataChunkKey(chunkKey)) {
      continue
    }

    if (!db.objectStoreNames.contains(chunkKey)) {
      db.createObjectStore(chunkKey, { keyPath: splitChunkKeyPath[chunkKey] })
    }
  }
}

function hasAllRequiredStores(db: IDBPDatabase): boolean {
  return (
    db.objectStoreNames.contains(metadataStore) &&
    db.objectStoreNames.contains(profileStore) &&
    playerDataChunkKeys
      .filter(isSplitPlayerDataChunkKey)
      .every((chunkKey) => db.objectStoreNames.contains(chunkKey))
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
 * Replaces a changed chunk on re-sync, in one transaction: a merged chunk deletes just its own rows
 * from the shared `profile` store (not a full `clear()`, which would wipe the other two chunks
 * sharing it) and re-adds its decomposed records; a split chunk empties its own store and re-adds
 * every record. Always also writes the chunk's metadata row. `data` is `unknown` here (already
 * zod-validated by the caller against the matching per-chunk schema) so the sync loop — which is
 * necessarily heterogeneous across chunk keys — doesn't need an unsound cast to call this;
 * `getChunkData`/`getChunkRecord` below are the typed read side.
 */
export async function replacePlayerDataChunk(
  chunkKey: PlayerDataChunkKey,
  data: unknown,
  metadata: PlayerDataMetadata
) {
  const storeName = storeNameForChunk(chunkKey)
  const db = await openPlayerDataDb()

  try {
    const transaction = db.transaction([storeName, metadataStore], "readwrite")
    const store = transaction.objectStore(storeName)

    if (isMergedPlayerDataChunkKey(chunkKey)) {
      await store.delete(chunkKeyRange(chunkKey))

      for (const record of decomposeMergedChunk(chunkKey, data)) {
        await store.put(record)
      }
    } else if (isSplitPlayerDataChunkKey(chunkKey)) {
      await store.clear()

      for (const record of Array.isArray(data) ? data : []) {
        await store.put(record)
      }
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
 * Reads a whole chunk's payload — reassembled from the shared `profile` store's rows for a merged
 * chunk, or from its own store's rows for a split chunk. Returns `undefined` if the chunk has never
 * been synced — determined via its metadata row rather than "no rows found", since a chunk that *has*
 * synced can legitimately hold zero records in a sub-collection (e.g. a player with no MoWs, or no
 * xp books), which must still read back as `[]`, not `undefined`.
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

    if (isMergedPlayerDataChunkKey(chunkKey)) {
      const records = (await db.getAll(
        profileStore,
        chunkKeyRange(chunkKey)
      )) as { id: string }[]

      return reassembleMergedChunk(chunkKey, records) as
        PlayerDataChunkPayload<K> | undefined
    }

    if (isSplitPlayerDataChunkKey(chunkKey)) {
      return (await db.getAll(chunkKey)) as PlayerDataChunkPayload<K>
    }

    return undefined
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
  const storeNames = [
    metadataStore,
    profileStore,
    ...playerDataChunkKeys.filter(isSplitPlayerDataChunkKey),
  ]
  const transaction = db.transaction(storeNames, "readwrite")

  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear()
  }

  await transaction.done
  db.close()
}
