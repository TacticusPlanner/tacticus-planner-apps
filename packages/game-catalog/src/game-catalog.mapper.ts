import type { GameCatalogDatasetKey } from "./types"

// Maps a dataset envelope's `data` (always a plain array now) into the id-keyed rows stored per
// storage model.
type DatasetToStorageModels = (data: unknown) => Record<string, unknown>[]

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

export const datasetToStorageModels: Record<
  GameCatalogDatasetKey,
  DatasetToStorageModels
> = {
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

export function mapDatasetRowToStorageModel<T extends Record<string, unknown>>(
  item: T
): T & { id: string } {
  const id = item.id

  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("GameCatalog records must include a string or numeric id.")
  }

  return { ...item, id: String(id) }
}
