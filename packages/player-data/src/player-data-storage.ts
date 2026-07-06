import { openDB } from "idb"

import {
  playerDataChunkKeys,
  playerDataManifestMetadataKey,
  type PlayerDataChunkKey,
} from "./chunk-keys"
import type { PlayerDataChunkPayload, PlayerDataMetadata } from "./types"

const playerDataDbName = "player-data"
const playerDataDbVersion = 1
const metadataStore = "metadata"

/**
 * Unlike @workspace/game-catalog's multi-row, id-keyed dataset stores, each player-data chunk is a
 * single per-profile payload (some are arrays, some are singleton objects — e.g. `inventory` or
 * `game-mode-tokens`). Each chunk therefore gets its own object store holding exactly one row: the
 * whole chunk payload, stored with an out-of-line key equal to the chunk key itself.
 */
async function openPlayerDataDb() {
  return openDB(playerDataDbName, playerDataDbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(metadataStore)) {
        db.createObjectStore(metadataStore, { keyPath: "key" })
      }

      for (const chunkKey of playerDataChunkKeys) {
        if (!db.objectStoreNames.contains(chunkKey)) {
          db.createObjectStore(chunkKey)
        }
      }
    },
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
 * Replaces a changed chunk on re-sync: overwrites its single stored row and its metadata, in one
 * transaction. `data` is `unknown` here (already zod-validated by the caller against the matching
 * per-chunk schema) so the sync loop — which is necessarily heterogeneous across chunk keys — doesn't
 * need an unsound cast to call this; `getChunkData` below is the typed read side.
 */
export async function replacePlayerDataChunk(
  chunkKey: PlayerDataChunkKey,
  data: unknown,
  metadata: PlayerDataMetadata
) {
  const db = await openPlayerDataDb()
  const transaction = db.transaction([chunkKey, metadataStore], "readwrite")

  await transaction.objectStore(chunkKey).put(data, chunkKey)
  await transaction.objectStore(metadataStore).put(metadata)

  await transaction.done
  db.close()
}

export async function saveManifestMetadata(metadata: PlayerDataMetadata) {
  const db = await openPlayerDataDb()

  try {
    await db.put(metadataStore, metadata)
  } finally {
    db.close()
  }
}

export async function getChunkData<K extends PlayerDataChunkKey>(
  chunkKey: K
): Promise<PlayerDataChunkPayload<K> | undefined> {
  const db = await openPlayerDataDb()

  try {
    return (await db.get(chunkKey, chunkKey)) as
      PlayerDataChunkPayload<K> | undefined
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
