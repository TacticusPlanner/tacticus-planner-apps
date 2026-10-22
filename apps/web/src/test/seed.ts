import type { GameCatalogDatasetKey } from "@workspace/game-catalog"
import {
  deleteGameCatalogDatabase,
  replaceGameCatalogDataset,
} from "@workspace/game-catalog/testing"
import type { PlayerDataChunkKey } from "@workspace/player-data"
import {
  deletePlayerDataDatabase,
  replacePlayerDataChunk,
} from "@workspace/player-data/testing"

const updatedAt = "2026-01-01T00:00:00Z"

/** Writes each dataset through the catalog's real storage, so live queries read it back. */
export async function seedGameCatalog(
  datasets: Partial<Record<GameCatalogDatasetKey, unknown>>
) {
  for (const [key, data] of Object.entries(datasets)) {
    await replaceGameCatalogDataset(key as GameCatalogDatasetKey, data, {
      key: key as GameCatalogDatasetKey,
      hash: `${key}-test`,
      catalogVersion: "test",
      gameVersion: "test",
      schemaVersion: 1,
      updatedAt,
    })
  }
}

/** Writes each chunk through player-data's real storage, so live queries read it back. */
export async function seedPlayerData(
  chunks: Partial<Record<PlayerDataChunkKey, unknown>>
) {
  for (const [key, data] of Object.entries(chunks)) {
    await replacePlayerDataChunk(key as PlayerDataChunkKey, data, {
      key: key as PlayerDataChunkKey,
      hash: `${key}-test`,
      schemaVersion: 1,
      updatedAt,
    })
  }
}

export async function resetTestDatabases() {
  await Promise.all([deleteGameCatalogDatabase(), deletePlayerDataDatabase()])
}
