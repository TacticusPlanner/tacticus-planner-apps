import {
  npcEncounterSources,
  type NpcEncounterBattle,
  type NpcEncounterLevel,
  type NpcEncounterSource,
  type NpcEncounterStorageModel,
} from "@workspace/game-catalog"

/** Every encounter source in display order: the order the encounters section and the game-mode filter use. */
export const NPC_ENCOUNTER_SOURCES: readonly NpcEncounterSource[] =
  npcEncounterSources

/** One served `npc-encounters` record (the stored row). */
export type NpcEncounter = NpcEncounterStorageModel

/** The encounters of every NPC, keyed by variation id, each list in served order. */
export type NpcEncounterIndex = ReadonlyMap<string, readonly NpcEncounter[]>

/**
 * What the list filters read from the `npc-encounters` data and the calendar. Passed only while that data is
 * present; `isRunning` is always false without a calendar.
 */
export type NpcEncounterLookup = {
  encountersOf: (variationId: string) => readonly NpcEncounter[]
  isRunning: (encounter: NpcEncounter) => boolean
}

const NO_ENCOUNTERS: readonly NpcEncounter[] = []
const NO_NPCS: readonly EncounterPlaceNpc[] = []

/**
 * One openable location of an encounter: a battle, a Survival round, an Onslaught tier, or the whole Guild
 * Raid group (a raid has no battles). `key` identifies it within its group, across every NPC's record.
 */
export type EncounterPlace = {
  key: string
  battle: NpcEncounterBattle
  round: number | null
}

/** One NPC at a place, and how many of it (`null` where the data names no number: a Guild Raid). */
export type EncounterPlaceNpc = {
  npcId: string
  count: number | null
  /** The count split by level; empty where the data names none (a Guild Raid). */
  levels: readonly NpcEncounterLevel[]
}

/** The NPCs at each place of each group; see `npcsAtPlace`. */
export type EncounterPlaceIndex = ReadonlyMap<
  string,
  readonly EncounterPlaceNpc[]
>

export const NO_ENCOUNTER_PLACES: EncounterPlaceIndex = new Map()

function placesOfBattle(
  source: NpcEncounterSource,
  battle: NpcEncounterBattle
): EncounterPlace[] {
  const place = (key: string, round: number | null = null) => ({
    key,
    battle,
    round,
  })
  switch (source) {
    case "guildRaid":
      return [place("group")]
    case "survival":
      return battle.rounds.map((round) => place(`${round}`, round))
    case "onslaught":
      return battle.tier === null ? [] : [place(`${battle.tier}`)]
    case "questEvent":
      return battle.number === null ? [] : [place(`${battle.number}`)]
    case "incursion":
      return [place(`${battle.tier}|${battle.battleId}`)]
    default:
      return battle.battleId === null ? [] : [place(battle.battleId)]
  }
}

/** The places of one encounter, in served order, each once. */
export function encounterPlaces(encounter: NpcEncounter): EncounterPlace[] {
  const places = new Map<string, EncounterPlace>()
  for (const battle of encounter.battles) {
    for (const place of placesOfBattle(encounter.source, battle)) {
      if (!places.has(place.key)) places.set(place.key, place)
    }
  }
  return [...places.values()]
}

const placeId = (
  source: NpcEncounterSource,
  groupId: string,
  placeKey: string
) => `${source}|${groupId}|${placeKey}`

/** Inverts the records into the NPCs at each place, so a battle can list everyone fought there. */
export function indexEncounterPlaces(
  index: NpcEncounterIndex
): EncounterPlaceIndex {
  const places = new Map<string, EncounterPlaceNpc[]>()
  for (const encounters of index.values()) {
    for (const encounter of encounters) {
      for (const { key, battle } of encounterPlaces(encounter)) {
        const id = placeId(encounter.source, encounter.groupId, key)
        const npc = {
          npcId: encounter.npcId,
          count: battle.count,
          levels: battle.levels,
        }
        const npcs = places.get(id)
        if (npcs) npcs.push(npc)
        else places.set(id, [npc])
      }
    }
  }
  return places
}

/** Every NPC recorded at one place of the encounter's group (the encounter's own NPC included). */
export function npcsAtPlace(
  index: EncounterPlaceIndex,
  encounter: NpcEncounter,
  placeKey: string
): readonly EncounterPlaceNpc[] {
  return (
    index.get(placeId(encounter.source, encounter.groupId, placeKey)) ?? NO_NPCS
  )
}

/** Groups the stored rows by NPC id, keeping their served order within each NPC. */
export function indexEncounters(
  records: readonly NpcEncounter[]
): NpcEncounterIndex {
  const index = new Map<string, NpcEncounter[]>()
  for (const record of records) {
    const list = index.get(record.npcId)
    if (list) list.push(record)
    else index.set(record.npcId, [record])
  }
  return index
}

/** The encounters of one variation: an empty list when the data names it nowhere. */
export function encountersOf(
  index: NpcEncounterIndex,
  variationId: string
): readonly NpcEncounter[] {
  return index.get(variationId) ?? NO_ENCOUNTERS
}

/** Orders encounters by source (display order), keeping served order within a source. */
export function sortEncountersBySource(
  encounters: readonly NpcEncounter[]
): NpcEncounter[] {
  const rank = (source: NpcEncounterSource) =>
    NPC_ENCOUNTER_SOURCES.indexOf(source)
  return [...encounters].sort((a, b) => rank(a.source) - rank(b.source))
}
