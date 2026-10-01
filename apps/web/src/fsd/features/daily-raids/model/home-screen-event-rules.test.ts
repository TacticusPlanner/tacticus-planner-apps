import { describe, expect, it } from "vitest"

import {
  battleEventPoints,
  hasHomeScreenEventRule,
  type RuleBattle,
  type RuleNpc,
} from "./home-screen-event-rules"

const npc = (partial: Partial<RuleNpc> = {}): RuleNpc => ({
  factionId: "Necrons",
  alliance: "Xenos",
  traits: [],
  ...partial,
})
const npcs = new Map<string, RuleNpc>([
  ["mech", npc({ traits: ["Mechanical"] })],
  ["mech-summon", npc({ traits: ["Mechanical", "Summon"] })],
  ["mech-steppable", npc({ traits: ["Mechanical", "Steppable"] })],
  ["mechanic", npc({ traits: ["Mechanic"] })],
  ["chaos", npc({ alliance: "Chaos", factionId: "Death Guard" })],
  ["tyranid", npc({ factionId: "Tyranids" })],
  ["plain", npc()],
])
const battle = (type: string, ...enemies: [string, number][]): RuleBattle => ({
  type,
  detailedEnemyTypes: enemies.map(([id, count]) => ({ id, count })),
})

describe("battleEventPoints", () => {
  it("scores an Elite Machine Hunt node 5 per Mechanical enemy", () => {
    expect(
      battleEventPoints("hse-machine-hunt", battle("Elite", ["mech", 4]), npcs)
    ).toBe(20)
  })

  it("scores a Standard node 3 per matching enemy and EliteMirror 5", () => {
    expect(
      battleEventPoints(
        "hse-machine-hunt",
        battle("Standard", ["mech", 4]),
        npcs
      )
    ).toBe(12)
    expect(
      battleEventPoints(
        "hse-machine-hunt",
        battle("EliteMirror", ["mech", 2]),
        npcs
      )
    ).toBe(10)
    expect(
      battleEventPoints("hse-machine-hunt", battle("Mirror", ["mech", 2]), npcs)
    ).toBe(6)
  })

  it("never counts Summon or Steppable enemies or the Mechanic trait", () => {
    expect(
      battleEventPoints(
        "hse-machine-hunt",
        battle(
          "Standard",
          ["mech", 2],
          ["mech-summon", 1],
          ["mech-steppable", 1],
          ["mechanic", 1]
        ),
        npcs
      )
    ).toBe(6)
  })

  it("matches Warp Surge on Chaos enemies and Purge Order on Tyranids", () => {
    expect(
      battleEventPoints(
        "hse-warp-surge",
        battle("Standard", ["chaos", 2], ["plain", 3]),
        npcs
      )
    ).toBe(6)
    expect(
      battleEventPoints(
        "hse-purge-order",
        battle("Standard", ["tyranid", 5], ["plain", 1]),
        npcs
      )
    ).toBe(15)
  })

  it("scores every enemy for Training Rush", () => {
    expect(
      battleEventPoints(
        "hse-training-rush",
        battle("Elite", ["plain", 2], ["chaos", 1]),
        npcs
      )
    ).toBe(15)
  })

  it("gives no points to an unknown event id and none to unresolved enemies", () => {
    expect(
      battleEventPoints("hse-faction-boost", battle("Elite", ["mech", 4]), npcs)
    ).toBe(0)
    expect(
      battleEventPoints(
        "hse-training-rush",
        battle("Standard", ["missing", 4]),
        npcs
      )
    ).toBe(0)
  })
})

describe("hasHomeScreenEventRule", () => {
  it("is true for the four raid-relevant events only", () => {
    for (const id of [
      "hse-warp-surge",
      "hse-machine-hunt",
      "hse-training-rush",
      "hse-purge-order",
    ]) {
      expect(hasHomeScreenEventRule(id)).toBe(true)
    }
    expect(hasHomeScreenEventRule("hse-faction-boost")).toBe(false)
    expect(hasHomeScreenEventRule("hse-squig-smash")).toBe(false)
  })
})
