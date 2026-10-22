import type { GameCatalogMythicQuestReward } from "@workspace/game-catalog"
import { datasetPayloadSchemas } from "@workspace/game-catalog/sync"
import { describe, expect, it } from "vitest"

import mythicQuestTasks from "../../../../../public/locales/en/mythicQuestTasks.json"
import fixture from "./mythic-quests.fixture.json"
import { mythicQuestReward, mythicTaskVariables } from "./mythic-quests"

// Served `mythic-quests` records for a few characters, and every task loca key the API serves
// (generated from tacticus-planner-api's GameCatalog/Data/mythic-quests.json).
const records = datasetPayloadSchemas["mythic-quests"].parse(fixture.records)
const quests = new Map<string, (typeof records)[number]["quests"]>(
  records.map((record) => [record.unitId, record.quests])
)
// A reward as the catalog serves it (ids are branded once parsed).
const served = (reward: object) => reward as GameCatalogMythicQuestReward

describe("mythicQuestReward", () => {
  it("maps each served reward type to a chip", () => {
    expect(
      mythicQuestReward(
        served({
          type: "MythicShards",
          amount: 4,
          unitId: "blackAbaddon",
        })
      )
    ).toEqual({ kind: "mythicShards", unitId: "blackAbaddon", quantity: 4 })
    expect(
      mythicQuestReward(
        served({
          type: "AscensionOrb",
          amount: 2,
          rarity: "Mythic",
          alliance: "Chaos",
        })
      )
    ).toEqual({ kind: "ascensionOrb", alliance: "Chaos", quantity: 2 })
    expect(
      mythicQuestReward(
        served({
          type: "AbilityBadge",
          amount: 5,
          rarity: "Mythic",
          alliance: "Xenos",
        })
      )
    ).toEqual({ kind: "abilityBadge", alliance: "Xenos", quantity: 5 })
    expect(
      mythicQuestReward(served({ type: "XpBook", amount: 1, rarity: "Mythic" }))
    ).toEqual({ kind: "xp", quantity: 1 })
    expect(
      mythicQuestReward(served({ type: "Gold", amount: 250_000 }))
    ).toEqual({
      kind: "gold",
      quantity: 250_000,
    })
    expect(
      mythicQuestReward(
        served({
          type: "Equipment",
          amount: 1,
          equipmentId: "I_Crit_M006",
        })
      )
    ).toEqual({ kind: "equipment", equipmentId: "I_Crit_M006", quantity: 1 })
  })
})

describe("mythicTaskVariables", () => {
  it("builds V1's template variables for Abaddon's first quest", () => {
    const [task] = quests.get("blackAbaddon")![0].tasks
    expect(
      mythicTaskVariables(
        task,
        (id) => (id === "blackAbaddon" ? "Abaddon" : id),
        (key, value) => (key === "trait" ? `trait:${value}` : value)
      )
    ).toEqual({
      TARGET_AMOUNT: [1],
      TRAIT: ["trait:Emplacement"],
      HERO_NAME: ["Abaddon"],
      KILL_AMOUNT: ["8"],
    })
  })

  it("has a template for every task the catalog serves", () => {
    const templates = mythicQuestTasks as Record<string, string>
    expect(fixture.locaKeys.filter((key) => !templates[key])).toEqual([])
  })
})
