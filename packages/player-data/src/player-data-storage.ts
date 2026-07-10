import Dexie, { type Table } from "dexie"

import {
  isMergedPlayerDataChunkKey,
  isSplitPlayerDataChunkKey,
  playerDataChunkKeys,
  playerDataManifestMetadataKey,
  splitPlayerDataChunkKeys,
  type MergedPlayerDataChunkKey,
  type PlayerDataChunkKey,
  type SplitPlayerDataChunkKey,
} from "./chunk-keys"
import type { PlayerDataChunkDto } from "./player-data.dto"
import type { PlayerDataMetadataStorageModel } from "./player-data.storage"

// Exported so tests can delete/reset the exact database the app uses (see player-data-sync.test.ts).
export const playerDataDbName = "tacticus-planner-player-data"
const playerDataDbVersion = 1
// Shared by every "merged" chunk (see chunk-keys.ts) — holds several small records per chunk instead
// of giving each chunk its own single-row store.
const profileStore = "profile"

/**
 * Natural per-record key for each split chunk's own store (see `splitPlayerDataChunkKeys` in
 * chunk-keys.ts). Campaign identity has no single natural id field, so it uses a compound key instead
 * of injecting a synthetic one.
 */
const splitChunkKeyPath: Record<SplitPlayerDataChunkKey, string | string[]> = {
  characters: "unitId",
  mows: "unitId",
  "inventory-upgrades": "upgradeId",
  "inventory-items": "itemId",
  "inventory-shards": "unitId",
  "campaign-progress": ["tacticusCampaignId", "type"],
  "campaign-events-progress": ["tacticusCampaignId", "type"],
  "lre-progress": "id",
}

// Dexie's schema-string syntax for a compound primary key is "[fieldA+fieldB]"; a plain field name is
// used as-is for a single-field key.
function toDexieKeyPath(keyPath: string | string[]): string {
  return Array.isArray(keyPath) ? `[${keyPath.join("+")}]` : keyPath
}

function storeNameForChunk(chunkKey: PlayerDataChunkKey): string {
  return isMergedPlayerDataChunkKey(chunkKey) ? profileStore : chunkKey
}

function withoutId<T extends { id: string }>(record: T): Omit<T, "id"> {
  const rest: Partial<T> = { ...record }
  delete rest.id
  return rest as Omit<T, "id">
}

function mergedChunkSummaryId(chunkKey: MergedPlayerDataChunkKey): string {
  return `${chunkKey}:summary`
}

/**
 * Wraps a merged chunk's whole payload as the single row stored in the shared `profile` store (see
 * chunk-keys.ts: none of these three chunks has one natural per-item id worth splitting on the way
 * the dedicated split chunks do, so each is kept as one summary row rather than decomposed further).
 */
function decomposeMergedChunk(
  chunkKey: MergedPlayerDataChunkKey,
  data: unknown
): Record<string, unknown>[] {
  return [{ id: mergedChunkSummaryId(chunkKey), ...(data as object) }]
}

/** Inverse of `decomposeMergedChunk`. Returns `undefined` if there's no summary record (chunk never synced). */
function reassembleMergedChunk(
  chunkKey: MergedPlayerDataChunkKey,
  records: { id: string }[]
): unknown {
  const summary = records.find((r) => r.id === mergedChunkSummaryId(chunkKey))
  return summary ? withoutId(summary) : undefined
}

/**
 * Single long-lived Dexie instance for the whole app's lifetime — idiomatic Dexie usage (repeatedly
 * closing/reopening a connection defeats its internal optimizations and is explicitly discouraged).
 * One complete `.version().stores()` block: this is greenfield (nothing has shipped), so there's no
 * historical version chain to replay. Dexie's own version-upgrade cascade — each version declares its
 * *complete* store list, and Dexie walks any older client through every version up to the latest — is
 * what future chunk additions should rely on (bump `playerDataDbVersion`, add a new
 * `.version(N+1).stores({...})` block here), not a custom self-heal workaround: this replaces the
 * previous hand-rolled "detect a missing store and reopen one version higher" logic entirely.
 */
class PlayerDataDb extends Dexie {
  metadata!: Table<PlayerDataMetadataStorageModel, string>

  constructor() {
    super(playerDataDbName)

    this.version(playerDataDbVersion).stores({
      metadata: "key",
      profile: "id",
      ...Object.fromEntries(
        splitPlayerDataChunkKeys.map((key) => [
          key,
          toDexieKeyPath(splitChunkKeyPath[key]),
        ])
      ),
    })
  }
}

const playerDataDb = new PlayerDataDb()

export async function getPlayerDataMetadata() {
  const values = await playerDataDb.metadata.toArray()

  return new Map(values.map((metadata) => [metadata.key, metadata]))
}

export function getManifestMetadata(
  metadata: ReadonlyMap<string, PlayerDataMetadataStorageModel>
) {
  return metadata.get(playerDataManifestMetadataKey)
}

export async function hasCompletePlayerDataCache() {
  const metadata = await getPlayerDataMetadata()

  return playerDataChunkKeys.every((chunkKey) => metadata.has(chunkKey))
}

/**
 * Replaces a changed chunk on re-sync, in one transaction: a merged chunk deletes just its own rows
 * from the shared `profile` store (`.where('id').startsWith(...)`, not a full `clear()`, which would
 * wipe the other two chunks sharing it) and re-adds its decomposed records; a split chunk empties its
 * own store and re-adds every record. Always also writes the chunk's metadata row. `data` is
 * `unknown` here (already zod-validated by the caller against the matching per-chunk schema) so the
 * sync loop — which is necessarily heterogeneous across chunk keys — doesn't need an unsound cast to
 * call this; `getChunkData`/`getChunkRecord` below are the typed read side.
 */
export async function replacePlayerDataChunk(
  chunkKey: PlayerDataChunkKey,
  data: unknown,
  metadata: PlayerDataMetadataStorageModel
) {
  const table = playerDataDb.table(storeNameForChunk(chunkKey))

  await playerDataDb.transaction(
    "rw",
    table,
    playerDataDb.metadata,
    async () => {
      if (isMergedPlayerDataChunkKey(chunkKey)) {
        await table.where("id").startsWith(`${chunkKey}:`).delete()
        await table.bulkPut(decomposeMergedChunk(chunkKey, data))
      } else if (isSplitPlayerDataChunkKey(chunkKey)) {
        await table.clear()
        await table.bulkPut(Array.isArray(data) ? data : [])
      }

      await playerDataDb.metadata.put(metadata)
    }
  )
}

export async function saveManifestMetadata(
  metadata: PlayerDataMetadataStorageModel
) {
  await playerDataDb.metadata.put(metadata)
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
): Promise<PlayerDataChunkDto<K> | undefined> {
  const chunkMetadata = await playerDataDb.metadata.get(chunkKey)

  if (!chunkMetadata) {
    return undefined
  }

  if (isMergedPlayerDataChunkKey(chunkKey)) {
    const records = await playerDataDb
      .table<{ id: string }, string>(profileStore)
      .where("id")
      .startsWith(`${chunkKey}:`)
      .toArray()

    return reassembleMergedChunk(chunkKey, records) as
      PlayerDataChunkDto<K> | undefined
  }

  if (isSplitPlayerDataChunkKey(chunkKey)) {
    return (await playerDataDb
      .table(chunkKey)
      .toArray()) as PlayerDataChunkDto<K>
  }

  return undefined
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
): Promise<PlayerDataChunkDto<K>[number] | undefined> {
  return playerDataDb.table(chunkKey).get(id as string | string[])
}

export async function clearPlayerDataDb() {
  const tableNames = ["metadata", profileStore, ...splitPlayerDataChunkKeys]

  await playerDataDb.transaction("rw", tableNames, async () => {
    await Promise.all(
      tableNames.map((name) => playerDataDb.table(name).clear())
    )
  })
}
