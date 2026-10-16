import { describe, expect, it } from "vitest"

import mythicQuests from "../../../../../public/locales/en/mythicQuests.json"
import mythicQuestTasks from "../../../../../public/locales/en/mythicQuestTasks.json"
import {
  mythicTaskVariables,
  parseMythicQuestReward,
  type MythicQuestData,
} from "./mythic-quests"

const quests = mythicQuests as unknown as Record<string, MythicQuestData[]>

describe("parseMythicQuestReward", () => {
  it("parses each reward kind V1's data uses", () => {
    expect(parseMythicQuestReward("mythicShards_blackAbaddon:4")).toEqual({
      kind: "mythicShards",
      unitId: "blackAbaddon",
      quantity: 4,
    })
    expect(parseMythicQuestReward("heroAscensionOrbMythic_Chaos:2")).toEqual({
      kind: "ascensionOrb",
      alliance: "Chaos",
      quantity: 2,
    })
    expect(parseMythicQuestReward("abilityTokenMythic_Xenos:5")).toEqual({
      kind: "abilityBadge",
      alliance: "Xenos",
      quantity: 5,
    })
    expect(parseMythicQuestReward("xpMythic:1")).toEqual({
      kind: "xp",
      quantity: 1,
    })
    expect(parseMythicQuestReward("gold:250000")).toEqual({
      kind: "gold",
      quantity: 250_000,
    })
    expect(parseMythicQuestReward("I_Crit_M006")).toEqual({
      kind: "equipment",
      equipmentId: "I_Crit_M006",
      quantity: undefined,
    })
    expect(parseMythicQuestReward("somethingNew:3")).toEqual({
      kind: "unknown",
      raw: "somethingNew",
      quantity: 3,
    })
  })

  it("recognises every reward in the ported data", () => {
    const unknown = Object.values(quests)
      .flat()
      .flatMap((quest) => quest.rewards)
      .filter((reward) => parseMythicQuestReward(reward).kind === "unknown")
    expect(unknown).toEqual([])
  })
})

describe("mythicTaskVariables", () => {
  it("builds V1's template variables for Abaddon's first quest", () => {
    const [task] = quests.blackAbaddon[0].tasks
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

  it("has a template for every task in the ported data", () => {
    const templates = mythicQuestTasks as Record<string, string>
    const missing = Object.values(quests)
      .flat()
      .flatMap((quest) => quest.tasks)
      .filter((task) => !templates[task.locaKey])
    expect(missing).toEqual([])
  })
})
