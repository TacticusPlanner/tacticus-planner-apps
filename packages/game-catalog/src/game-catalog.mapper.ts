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

// ascension-costs is keyed by its progression step string; unlock-shard-costs by rarity — both are
// single shared ladders/tables with no id of their own, so the natural key doubles as the store id.
function byProgression(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((row) => ({ id: row.progression, ...row }))
}

function byRarity(data: unknown): Record<string, unknown>[] {
  return asArray(data).map((row) => ({ id: row.rarity, ...row }))
}

// events-calendar is the one dataset whose payload isn't a plain array — it's a date-indexed object
// (ISO date string -> entries). Flatten it into one row per (date, entry) pair, injecting `date` as a
// real field, with an id unique per date+definition+occurrence (an occurrence's own id is unique across
// dates on its own, but a projected placeholder has no occurrence id, so definitionId disambiguates
// between different definitions' placeholders sharing the same date).
function byCalendarDate(data: unknown): Record<string, unknown>[] {
  if (typeof data !== "object" || data === null) {
    return []
  }

  return Object.entries(data as Record<string, unknown>).flatMap(
    ([date, entries]) =>
      asArray(entries).map((entry) => ({
        id: `${date}::${entry.definitionId}::${entry.occurrenceId ?? "projected"}`,
        date,
        ...entry,
      }))
  )
}

export const datasetToStorageModels: Record<
  GameCatalogDatasetKey,
  DatasetToStorageModels
> = {
  characters: asArray,
  npcs: asArray,
  mows: asArray,
  "mow-upgrade-costs": byLevel,
  "ascension-costs": byProgression,
  "unlock-shard-costs": byRarity,
  "onslaught-rewards": asArray,
  upgrades: asArray,
  equipment: asArray,
  "campaign-battles": asArray,
  "campaign-definitions": groupsWithId,
  lres: asArray,
  "lre-battles": asArray,
  "lre-common": asArray,
  "event-definitions": asArray,
  "events-calendar": byCalendarDate,
  // Plain-array passthrough — each shop record already carries its `id` (guild / war / ...).
  shops: asArray,
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
