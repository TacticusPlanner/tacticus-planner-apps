// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// dataset-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import { getDatasetRecords } from "./game-catalog-storage"
import type {
  AscensionCostStorageModel,
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
  CharacterStorageModel,
  EquipmentStorageModel,
  EventDefinitionStorageModel,
  EventsCalendarStorageModel,
  MowStorageModel,
  NpcStorageModel,
  OnslaughtRewardStorageModel,
  UnlockShardCostStorageModel,
  UpgradeStorageModel,
} from "./game-catalog.storage"

export function getCharacters(): Promise<CharacterStorageModel[]> {
  return getDatasetRecords("characters")
}

// Dexie has no built-in "return this table as a Map" method — this just wraps getCharacters()'s
// array in one, for the common case of a caller indexing characters by id (e.g. Character Lookup's
// charactersById) instead of hand-rolling `new Map(records.map(...))` at every call site.
export async function getCharactersMap(): Promise<
  Map<string, CharacterStorageModel>
> {
  const characters = await getCharacters()
  return new Map(characters.map((character) => [character.id, character]))
}

export function getMows(): Promise<MowStorageModel[]> {
  return getDatasetRecords("mows")
}

export function getNpcs(): Promise<NpcStorageModel[]> {
  return getDatasetRecords("npcs")
}

export async function getNpcsMap(): Promise<Map<string, NpcStorageModel>> {
  const npcs = await getNpcs()
  return new Map(npcs.map((npc) => [npc.id, npc]))
}

// Mirrors getCharactersMap() — the common case of indexing Machines of War by id.
export async function getMowsMap(): Promise<Map<string, MowStorageModel>> {
  const mows = await getMows()
  return new Map(mows.map((mow) => [mow.id, mow]))
}

export function getAscensionCosts(): Promise<AscensionCostStorageModel[]> {
  return getDatasetRecords("ascension-costs")
}

// Indexes the shared ascension cost ladder by progression step (its natural, storage-managed id).
export async function getAscensionCostsMap(): Promise<
  Map<string, AscensionCostStorageModel>
> {
  const costs = await getAscensionCosts()
  return new Map(costs.map((cost) => [cost.id, cost]))
}

export function getUnlockShardCosts(): Promise<UnlockShardCostStorageModel[]> {
  return getDatasetRecords("unlock-shard-costs")
}

export function getOnslaughtRewards(): Promise<OnslaughtRewardStorageModel[]> {
  return getDatasetRecords("onslaught-rewards")
}

// Indexes the per-rarity unlock shard cost table by rarity (its natural, storage-managed id).
export async function getUnlockShardCostsMap(): Promise<
  Map<string, UnlockShardCostStorageModel>
> {
  const costs = await getUnlockShardCosts()
  return new Map(costs.map((cost) => [cost.id, cost]))
}

export function getUpgrades(): Promise<UpgradeStorageModel[]> {
  return getDatasetRecords("upgrades")
}

export function getEquipment(): Promise<EquipmentStorageModel[]> {
  return getDatasetRecords("equipment")
}

// Mirrors getCharactersMap() — the common case of indexing equipment/relic items by id (e.g. an
// UpgradeEquipment goal's picker/level-bound lookup).
export async function getEquipmentMap(): Promise<
  Map<string, EquipmentStorageModel>
> {
  const equipment = await getEquipment()
  return new Map(equipment.map((item) => [item.id, item]))
}

export function getCampaignBattles(): Promise<CampaignBattleStorageModel[]> {
  return getDatasetRecords("campaign-battles")
}

export function getCampaignDefinitions(): Promise<
  CampaignDefinitionStorageModel[]
> {
  return getDatasetRecords("campaign-definitions")
}

export function getEventDefinitions(): Promise<EventDefinitionStorageModel[]> {
  return getDatasetRecords("event-definitions")
}

export async function getEventDefinitionsMap(): Promise<
  Map<string, EventDefinitionStorageModel>
> {
  const definitions = await getEventDefinitions()
  return new Map(definitions.map((definition) => [definition.id, definition]))
}

// events-calendar is stored one row per (date, entry) pair (see game-catalog.mapper.ts's
// byCalendarDate), so a multi-day entry appears once per date it spans — dedupe by occurrence identity
// (an authored occurrence's own id, or definitionId+startUtc for a projected placeholder, which has no
// occurrence id of its own) before returning results to a caller.
function dedupeCalendarEntries(
  rows: EventsCalendarStorageModel[]
): EventsCalendarStorageModel[] {
  const byIdentity = new Map<string, EventsCalendarStorageModel>()

  for (const row of rows) {
    const identity = row.occurrenceId ?? `${row.definitionId}::${row.startUtc}`
    if (!byIdentity.has(identity)) {
      byIdentity.set(identity, row)
    }
  }

  return [...byIdentity.values()]
}

/**
 * Events whose window contains `at` (start inclusive, end exclusive — see
 * specs/game-events-calendar in the integrate-game-events-calendar change).
 */
export async function getEventsActiveAt(
  at: Date
): Promise<EventsCalendarStorageModel[]> {
  const atMs = at.getTime()
  const rows = await getDatasetRecords("events-calendar")
  const active = rows.filter(
    (row) => Date.parse(row.startUtc) <= atMs && atMs < Date.parse(row.endUtc)
  )

  return dedupeCalendarEntries(active)
}

export function getEventsActiveNow(): Promise<EventsCalendarStorageModel[]> {
  return getEventsActiveAt(new Date())
}

/** Events whose window overlaps [rangeStart, rangeEnd). */
export async function getUpcomingEvents(
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventsCalendarStorageModel[]> {
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  const rows = await getDatasetRecords("events-calendar")
  const inRange = rows.filter(
    (row) =>
      Date.parse(row.startUtc) < rangeEndMs &&
      Date.parse(row.endUtc) > rangeStartMs
  )

  return dedupeCalendarEntries(inRange)
}
