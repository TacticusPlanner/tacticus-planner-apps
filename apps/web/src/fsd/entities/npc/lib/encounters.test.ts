import { describe, expect, it } from "vitest"

import {
  NPC_ENCOUNTER_SOURCES,
  encounterPlaces,
  encountersOf,
  indexEncounterPlaces,
  indexEncounters,
  npcsAtPlace,
  sortEncountersBySource,
  type NpcEncounter,
} from "./encounters"

const encounter = (
  npcId: string,
  source: NpcEncounter["source"],
  groupId: string
): NpcEncounter => ({
  id: `${npcId}|${source}|${groupId}`,
  npcId,
  source,
  groupId,
  battles: [
    {
      battleId: null,
      track: null,
      tier: null,
      number: 1,
      challenge: false,
      role: "enemy",
      rounds: [],
      count: 1,
      levels: [],
    },
  ],
})

const rows = [
  encounter("tyranNpc3Termagant", "onslaught", "onslaught"),
  encounter("orksNpc1Grot", "campaign", "campaign3"),
  encounter("tyranNpc3Termagant", "campaign", "campaign3"),
  encounter("tyranNpc3Termagant", "campaign", "campaign1"),
]

describe("encounter index", () => {
  it("keeps served order per npc", () => {
    const index = indexEncounters(rows)
    expect(
      encountersOf(index, "tyranNpc3Termagant").map((e) => e.groupId)
    ).toEqual(["onslaught", "campaign3", "campaign1"])
  })

  it("gives an empty list for an npc the data names nowhere", () => {
    expect(encountersOf(indexEncounters(rows), "genesDecoy")).toEqual([])
  })

  it("orders by source in display order, keeping served order within a source", () => {
    const sorted = sortEncountersBySource(
      encountersOf(indexEncounters(rows), "tyranNpc3Termagant")
    )
    expect(sorted.map((e) => `${e.source}:${e.groupId}`)).toEqual([
      "campaign:campaign3",
      "campaign:campaign1",
      "onslaught:onslaught",
    ])
  })

  it("has the eight sources in the fixed order", () => {
    expect(NPC_ENCOUNTER_SOURCES).toEqual([
      "campaign",
      "campaignEvent",
      "legendaryEvent",
      "questEvent",
      "incursion",
      "guildRaid",
      "survival",
      "onslaught",
    ])
  })
})

describe("encounter places", () => {
  const blank: NpcEncounter["battles"][number] = {
    battleId: null,
    track: null,
    tier: null,
    number: null,
    challenge: false,
    role: "enemy",
    rounds: [],
    count: null,
    levels: [],
  }
  const record = (
    npcId: string,
    source: NpcEncounter["source"],
    groupId: string,
    battles: Partial<NpcEncounter["battles"][number]>[]
  ): NpcEncounter => ({
    id: `${npcId}|${source}|${groupId}`,
    npcId,
    source,
    groupId,
    battles: battles.map((battle) => ({ ...blank, ...battle })),
  })
  const keys = (encounter: NpcEncounter) =>
    encounterPlaces(encounter).map((place) => place.key)

  it("gives each source its own kind of place", () => {
    expect(keys(record("a", "campaign", "c", [{ battleId: "I03" }]))).toEqual([
      "I03",
    ])
    expect(keys(record("a", "questEvent", "q", [{ number: 2 }]))).toEqual(["2"])
    expect(
      keys(record("a", "incursion", "m", [{ tier: 0, battleId: "1" }]))
    ).toEqual(["0|1"])
    expect(keys(record("a", "survival", "s", [{ rounds: [1, 3] }]))).toEqual([
      "1",
      "3",
    ])
    expect(
      keys(record("a", "onslaught", "onslaught", [{ tier: 4, rounds: [1, 2] }]))
    ).toEqual(["4"])
  })

  it("treats a Guild Raid group as one place, whatever the roles", () => {
    expect(
      keys(record("a", "guildRaid", "g", [{ role: "boss" }, { role: "enemy" }]))
    ).toEqual(["group"])
  })

  it("lists every NPC at a place and nobody from another place or group", () => {
    const warden = record("warden", "campaign", "c1", [
      { battleId: "I03" },
      { battleId: "I07" },
    ])
    const destroyer = record("destroyer", "campaign", "c1", [
      { battleId: "I03", count: 4 },
    ])
    const otherGroup = record("grot", "campaign", "c2", [{ battleId: "I03" }])
    const places = indexEncounterPlaces(
      indexEncounters([warden, destroyer, otherGroup])
    )

    expect(npcsAtPlace(places, warden, "I03")).toEqual([
      { npcId: "warden", count: null, levels: [] },
      { npcId: "destroyer", count: 4, levels: [] },
    ])
    expect(npcsAtPlace(places, warden, "I07")).toEqual([
      { npcId: "warden", count: null, levels: [] },
    ])
    expect(npcsAtPlace(places, warden, "missing")).toEqual([])
  })

  it("keeps the same battle of two incursion tiers apart", () => {
    const low = record("a", "incursion", "m", [{ tier: 0, battleId: "1" }])
    const high = record("b", "incursion", "m", [{ tier: 1, battleId: "1" }])
    const places = indexEncounterPlaces(indexEncounters([low, high]))

    expect(npcsAtPlace(places, low, "0|1")).toEqual([
      { npcId: "a", count: null, levels: [] },
    ])
    expect(npcsAtPlace(places, high, "1|1")).toEqual([
      { npcId: "b", count: null, levels: [] },
    ])
  })

  it("keeps a count per Survival round", () => {
    const level = { servedIndex: 4, count: 2 }
    const survivor = record("a", "survival", "s", [
      { rounds: [1], count: 6 },
      { rounds: [3], count: 2, levels: [level] },
    ])
    const places = indexEncounterPlaces(indexEncounters([survivor]))

    expect(npcsAtPlace(places, survivor, "3")).toEqual([
      { npcId: "a", count: 2, levels: [level] },
    ])
  })
})
