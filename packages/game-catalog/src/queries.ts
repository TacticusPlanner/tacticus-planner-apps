// Named, business-purpose read queries over the local store. The app's read layer
// (`apps/web/src/fsd/shared/local-data`) caches whole datasets read through `getDatasetRecords` and derives
// views with selectors; the named queries serve composite reads and non-React callers. Nothing
// outside the package touches the Dexie instance itself.
import {
  getDatasetRecord,
  getDatasetRecords,
  hasCatalogSynced,
  hasDatasetSynced,
} from "./game-catalog-storage"
// The app's read layer (`apps/web/src/fsd/shared/local-data`) caches whole datasets read through this.
export { getDatasetRecords }

import type {
  AscensionCostStorageModel,
  CharacterAbilityCostStorageModel,
  MowUpgradeCostStorageModel,
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
  CharacterStorageModel,
  EquipmentStorageModel,
  EventDefinitionStorageModel,
  GuildRaidMetaStorageModel,
  EventsCalendarStorageModel,
  LegendaryEventBattleStorageModel,
  HordeModeTiersStorageModel,
  UnitPowerStorageModel,
  LegendaryEventStorageModel,
  MowStorageModel,
  MythicQuestsStorageModel,
  NpcStorageModel,
  OnslaughtRewardStorageModel,
  RaidBossesStorageModel,
  ShopStorageModel,
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

// Each character's mythic quests, keyed by character id. A character with no quests (or a client whose
// catalog predates the dataset) is simply absent from the map.
export async function getMythicQuestsByUnitId(): Promise<
  Map<string, MythicQuestsStorageModel>
> {
  const rows = await getDatasetRecords("mythic-quests")
  return new Map(rows.map((row) => [row.unitId, row]))
}

export function getMowUpgradeCosts(): Promise<MowUpgradeCostStorageModel[]> {
  return getDatasetRecords("mow-upgrade-costs")
}

export function getCharacterAbilityCosts(): Promise<
  CharacterAbilityCostStorageModel[]
> {
  return getDatasetRecords("character-ability-costs")
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

export function getShops(): Promise<ShopStorageModel[]> {
  return getDatasetRecords("shops")
}

// Indexes the four daily shops by their stable id (guild / war / rogue-trader / crusade) — the common
// case for a page that resolves one shop at a time (the Library browser) or all four (recommendations).
export async function getShopsMap(): Promise<Map<string, ShopStorageModel>> {
  const shops = await getShops()
  return new Map(shops.map((shop) => [shop.id, shop]))
}

// raid-bosses is stored as a single row (see game-catalog.mapper.ts's asSingleRow). Returns the whole
// payload — `{ seasonConfigRotation, bosses[], primes[], seasons{} }` — or `null` when the dataset has
// never synced into this client (distinct from a synced-but-empty payload, which the API forbids), so a
// consumer can show a feature-unavailable state.
export async function getRaidBosses(): Promise<RaidBossesStorageModel | null> {
  const rows = await getDatasetRecords("raid-bosses")
  return rows[0] ?? null
}

// The Bosses / Primes split plus an id -> record index, for a page that renders the two sections and
// resolves a selected entity. Returns `null` when the dataset has not synced.
export async function getRaidBossRoster(): Promise<{
  bosses: RaidBossesStorageModel["bosses"]
  primes: RaidBossesStorageModel["primes"]
  byId: Map<string, RaidBossesStorageModel["bosses"][number]>
} | null> {
  const raidBosses = await getRaidBosses()
  if (!raidBosses) {
    return null
  }

  const all = [...raidBosses.bosses, ...raidBosses.primes]
  return {
    bosses: raidBosses.bosses,
    primes: raidBosses.primes,
    byId: new Map(all.map((unit) => [unit.unitSetId, unit])),
  }
}

// Guild Raid Meta is one curated payload. `null` means it has not synchronized yet; a present value
// with `boss: null` from the lookup below means this known dataset has no authored group for that boss.
export async function getGuildRaidMeta(): Promise<GuildRaidMetaStorageModel | null> {
  const rows = await getDatasetRecords("guild-raid-meta")
  return rows[0] ?? null
}

export async function getGuildRaidMetaForBoss(bossUnitSetId: string): Promise<{
  meta: GuildRaidMetaStorageModel
  boss: GuildRaidMetaStorageModel["bosses"][number] | null
} | null> {
  const meta = await getGuildRaidMeta()
  if (!meta) {
    return null
  }

  return {
    meta,
    boss:
      meta.bosses.find((boss) => boss.bossUnitSetId === bossUnitSetId) ?? null,
  }
}

// Mirrors getGuildRaidMetaForBoss(): `prime: null` distinguishes a prime with no curated comp yet
// (a valid state — it may still appear in a boss's primeUnitSetIds) from an unsynced dataset.
export async function getGuildRaidMetaForPrime(
  primeUnitSetId: string
): Promise<{
  meta: GuildRaidMetaStorageModel
  prime: GuildRaidMetaStorageModel["primes"][number] | null
} | null> {
  const meta = await getGuildRaidMeta()
  if (!meta) {
    return null
  }

  return {
    meta,
    prime:
      meta.primes.find((prime) => prime.primeUnitSetId === primeUnitSetId) ??
      null,
  }
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

// Whether the calendar and the event definitions it is read with have both synced at least once, so a
// caller can tell "no such event" from "the catalog has not arrived yet" (the init gate renders routes
// under its overlay while the first sync downloads).
export async function hasEventsCalendarSynced(): Promise<boolean> {
  const [calendar, definitions] = await Promise.all([
    hasDatasetSynced("events-calendar"),
    hasDatasetSynced("event-definitions"),
  ])
  return calendar && definitions
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
 * specs/game-events-calendar in the integrate-game-events-calendar change). A pure selector over the
 * `events-calendar` dataset, for callers that already hold it (the web app's cached read layer).
 */
export function selectEventsActiveAt(
  rows: EventsCalendarStorageModel[],
  at: Date
): EventsCalendarStorageModel[] {
  const atMs = at.getTime()
  return dedupeCalendarEntries(
    rows.filter(
      (row) => Date.parse(row.startUtc) <= atMs && atMs < Date.parse(row.endUtc)
    )
  )
}

export async function getEventsActiveAt(
  at: Date
): Promise<EventsCalendarStorageModel[]> {
  return selectEventsActiveAt(await getDatasetRecords("events-calendar"), at)
}

export function getEventsActiveNow(): Promise<EventsCalendarStorageModel[]> {
  return getEventsActiveAt(new Date())
}

/** Events whose window overlaps [rangeStart, rangeEnd); a pure selector like `selectEventsActiveAt`. */
export function selectUpcomingEvents(
  rows: EventsCalendarStorageModel[],
  rangeStart: Date,
  rangeEnd: Date
): EventsCalendarStorageModel[] {
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  return dedupeCalendarEntries(
    rows.filter(
      (row) =>
        Date.parse(row.startUtc) < rangeEndMs &&
        Date.parse(row.endUtc) > rangeStartMs
    )
  )
}

export async function getUpcomingEvents(
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventsCalendarStorageModel[]> {
  return selectUpcomingEvents(
    await getDatasetRecords("events-calendar"),
    rangeStart,
    rangeEnd
  )
}

// Every Legendary Event in the catalog. Reads the `lres` store (pending rename to `legendary-events`).
export function getLegendaryEvents(): Promise<LegendaryEventStorageModel[]> {
  return getDatasetRecords("lres")
}

// One Legendary Event by its id (the event unit's snowprint id, e.g. "astarLysander"), or `undefined`
// when the catalog has no such event. Reads the `lres` store (pending rename to `legendary-events`).
export function getLegendaryEvent(
  id: string
): Promise<LegendaryEventStorageModel | undefined> {
  return getDatasetRecord("lres", id)
}

// Whether the Legendary Event dataset has synced at least once, so a caller can tell "no such event"
// from "the catalog has not arrived yet" (the init gate renders routes under its overlay). Reads the
// `lres` store's metadata (pending rename to `legendary-events`).
export function hasLegendaryEventsSynced(): Promise<boolean> {
  return hasDatasetSynced("lres")
}

// One Legendary Event's battles (every lane), keyed "{lreId}-{track}-{number}". A lane orders them
// by its own `battleIds`. Reads the `lre-battles` store (pending rename alongside `lres`).
export async function getLegendaryEventBattles(
  lreId: string
): Promise<LegendaryEventBattleStorageModel[]> {
  const rows = await getDatasetRecords("lre-battles")
  return rows.filter((row) => row.lreId === lreId)
}

// Several Legendary Events' battles from one read of the `lre-battles` store, grouped by event id.
// Every requested id is present (an empty list when the catalog has none for it).
export async function getLegendaryEventsBattles(
  lreIds: readonly string[]
): Promise<Record<string, LegendaryEventBattleStorageModel[]>> {
  const grouped: Record<string, LegendaryEventBattleStorageModel[]> =
    Object.fromEntries(lreIds.map((lreId) => [lreId, []]))
  if (lreIds.length === 0) return grouped
  const rows = await getDatasetRecords("lre-battles")
  for (const row of rows) grouped[row.lreId]?.push(row)
  return grouped
}

// The curated horde-mode tier list — a single record — or `null` when the dataset is absent (not
// served by the API, or not synced yet).
export async function getHordeModeTiers(): Promise<HordeModeTiersStorageModel | null> {
  const rows = await getDatasetRecords("horde-mode-tiers")
  return rows[0] ?? null
}

// The game's power tables — a single record — or `null` when the dataset is absent (not served by the
// API, or not synced yet).
export async function getUnitPower(): Promise<UnitPowerStorageModel | null> {
  const rows = await getDatasetRecords("unit-power")
  return rows[0] ?? null
}

// Whether the catalog has fully synced at least once on this client, so a caller can tell an absent
// optional dataset (`getUnitPower()` null after a sync: not served) from one not synced yet (a fresh
// device before its first sync completes).
export function hasGameCatalogSynced(): Promise<boolean> {
  return hasCatalogSynced()
}
