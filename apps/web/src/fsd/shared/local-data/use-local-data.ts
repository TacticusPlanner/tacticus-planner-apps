import { useQuery } from "@tanstack/react-query"
import type {
  GameCatalogDatasetKey,
  StorageModel,
} from "@workspace/game-catalog"
import { getDatasetRecords } from "@workspace/game-catalog/queries"
import type {
  PlayerDataChunkDto,
  PlayerDataChunkKey,
} from "@workspace/player-data"
import { getChunkData } from "@workspace/player-data/queries"

import {
  localReadQueryOptions,
  useQueryReadState,
  withReadTimeout,
  type ReadState,
} from "@/shared/lib"

export type LocalDataSource = "catalog" | "player"

/** Query keys of the read layer; a sync invalidates `["local", source, key]` per item it wrote. */
export const localDataKeys = {
  all: ["local"] as const,
  composite: ["local", "composite"] as const,
  item: (source: LocalDataSource, key: string) =>
    ["local", source, key] as const,
}

/**
 * One catalog dataset, read from IndexedDB once per session and shared by every consumer. `select`
 * derives a view (a map by id, one event's battles); pass a module-level function or a memoised one
 * so the derived value stays referentially stable while the dataset is unchanged.
 */
export function useCatalogDataset<
  K extends GameCatalogDatasetKey,
  T = StorageModel<K>[],
>(key: K, select?: (records: StorageModel<K>[]) => T): ReadState<T> {
  const query = useQuery({
    queryKey: localDataKeys.item("catalog", key),
    queryFn: () => withReadTimeout(getDatasetRecords(key)),
    select,
    ...localReadQueryOptions,
  })
  return useQueryReadState(query)
}

/** One player-data chunk (null until it has synced once), read and shared like `useCatalogDataset`. */
export function usePlayerChunk<
  K extends PlayerDataChunkKey,
  T = PlayerDataChunkDto<K> | null,
>(key: K, select?: (chunk: PlayerDataChunkDto<K> | null) => T): ReadState<T> {
  const query = useQuery({
    queryKey: localDataKeys.item("player", key),
    queryFn: async () => (await withReadTimeout(getChunkData(key))) ?? null,
    select,
    ...localReadQueryOptions,
  })
  return useQueryReadState(query)
}

/** Records indexed by `id`; a module-level selector, so TanStack memoises the map per dataset. */
export function toById<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]))
}
