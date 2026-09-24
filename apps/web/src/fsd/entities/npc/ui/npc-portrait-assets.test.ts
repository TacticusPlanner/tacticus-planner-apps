import { describe, expect, it } from "vitest"

import { abilityIcon, factionIcon, npcPortrait } from "@workspace/game-catalog"

// The raw override map is not part of the package's public API; reach it directly for the audit.
import { npcPortraitOverrides } from "../../../../../../../packages/game-catalog/src/game-entities/npc-portrait-overrides"
import npcAbilityIds from "@/test/fixtures/npc-ability-ids.json"

// Vite's glob lists the shipped assets at build time, so the audit runs without node's fs.
const shippedPortraits = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/characters/*.png", { query: "?url" })
  ).map((path) => path.split("/").pop()!)
)
const shippedEmblems = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/factions/*.png", { query: "?url" })
  ).map((path) => path.split("/").pop()!)
)

const shippedAbilityIcons = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/abilities/*.png", { query: "?url" })
  ).map((path) => path.split("/").pop()!)
)

// Loot objects and power-ups are served with `kind: "object"` and never listed, so their portraits
// (supply pods, hero-spawn power-ups) are intentionally not shipped.
const isObjectId = (id: string) => /^(LootObj_|powup)/.test(id)

describe("NPC portrait assets", () => {
  it("ships a portrait file for every mapped unit variation", () => {
    expect(shippedPortraits.size).toBeGreaterThan(100)

    const missing = Object.entries(npcPortraitOverrides)
      .filter(([id]) => !isObjectId(id))
      .filter(([, file]) => !shippedPortraits.has(file))
      .map(([id, file]) => `${id} -> ${file}`)

    expect(missing).toEqual([])
  })

  it("resolves through the public helper to a shipped file", () => {
    const url = npcPortrait("necroBossWarden")
    expect(url).toBeDefined()
    expect(shippedPortraits.has(url!.split("/").pop()!)).toBe(true)
  })
})

describe("faction emblem assets", () => {
  it("ships an emblem for every NPC faction id (except Objects)", () => {
    const npcFactionIds = [
      "AdeptusAstartes",
      "AdeptusMechanicus",
      "Aeldari",
      "AstraMilitarum",
      "BlackLegion",
      "BlackTemplars",
      "BloodAngels",
      "DarkAngels",
      "DeathGuard",
      "Genestealers",
      "LeaguesOfVotann",
      "Necrons",
      "Orks",
      "Sisterhood",
      "SpaceWolves",
      "Tau",
      "ThousandSons",
      "Tyranids",
      "Ultramarines",
      "WorldEaters",
    ]
    const missing = npcFactionIds.filter(
      (id) => !shippedEmblems.has(factionIcon(id)!.split("/").pop()!)
    )
    expect(missing).toEqual([])
  })
})

describe("ability icon assets", () => {
  // The game ships no icon for these; the chip renders the name alone (or the id is unnamed and
  // dropped entirely). Listed explicitly so a future datamine adding one fails this test loudly.
  const knownAbsent = [
    "BossEndFightUndefeated",
    "DeathwingKnight",
    "HaywireMineSteppable",
    "RepairEnthusiast",
    "RunsAround",
    "RunsAway",
  ]

  it("ships an icon for every NPC ability except the known-absent ids", () => {
    expect(shippedAbilityIcons.size).toBeGreaterThan(400)

    const missing = npcAbilityIds
      .filter(
        (id) => !shippedAbilityIcons.has(abilityIcon(id).split("/").pop()!)
      )
      .sort()

    expect(missing).toEqual(knownAbsent)
  })
})
