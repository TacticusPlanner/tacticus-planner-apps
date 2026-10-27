import { describe, expect, it } from "vitest"

import { abilityIcon, factionIcon, npcPortrait } from "@workspace/game-catalog"

// The raw override map is not part of the package's public API; reach it directly for the audit.
import { npcPortraitOverrides } from "../../../../../../../packages/game-catalog/src/game-entities/npc-portrait-overrides"
import npcAbilityIds from "@/test/fixtures/npc-ability-ids.json"

// Vite's glob lists the shipped assets at build time, so the audit runs without node's fs. Each entry
// is the asset's URL path (`/game_catalog/...`), the form the icon helpers return in tests.
const shippedCatalogImages = new Set(
  Object.keys(
    import.meta.glob("/public/game_catalog/**/*.webp", { query: "?url" })
  ).map((path) => path.replace(/^\/public/, ""))
)

// Loot objects and power-ups are served with `kind: "object"` and never listed, so their portraits
// (supply pods, hero-spawn power-ups) are intentionally not shipped.
const isObjectId = (id: string) => /^(LootObj_|powup)/.test(id)

describe("NPC portrait assets", () => {
  it("ships a portrait file for every mapped unit variation", () => {
    expect(shippedCatalogImages.size).toBeGreaterThan(2000)

    const missing = Object.keys(npcPortraitOverrides)
      .filter((id) => !isObjectId(id))
      .filter((id) => !shippedCatalogImages.has(npcPortrait(id)!))

    expect(missing).toEqual([])
  })

  it("resolves through the public helper to a shipped file", () => {
    const url = npcPortrait("necroBossWarden")
    expect(url).toBeDefined()
    expect(shippedCatalogImages.has(url!)).toBe(true)
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
      (id) => !shippedCatalogImages.has(factionIcon(id) ?? "")
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
    expect(shippedCatalogImages.size).toBeGreaterThan(2000)

    const missing = npcAbilityIds
      .filter((id) => !shippedCatalogImages.has(abilityIcon(id)))
      .sort()

    expect(missing).toEqual(knownAbsent)
  })
})
