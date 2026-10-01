import { describe, expect, it } from "vitest"

import { battleEnemyTraits, listEnemyTraits } from "./battle-enemy-traits"

const npcs = new Map([
  ["bot", { traits: ["Mechanical", "Flying"] }],
  ["imp", { traits: ["Daemon", "Flying"] }],
  ["plain", { traits: [] }],
])
const battle = (...ids: string[]) => ({
  detailedEnemyTypes: ids.map((id) => ({ id, count: 2 })),
})

describe("battleEnemyTraits", () => {
  it("unions and de-duplicates the traits of every enemy", () => {
    expect(battleEnemyTraits(battle("bot", "imp"), npcs).sort()).toEqual([
      "Daemon",
      "Flying",
      "Mechanical",
    ])
  })

  it("ignores an enemy id the dataset cannot resolve", () => {
    expect(battleEnemyTraits(battle("ghost", "plain"), npcs)).toEqual([])
  })
})

describe("listEnemyTraits", () => {
  it("lists each trait once across battles, sorted", () => {
    expect(
      listEnemyTraits([battle("bot"), battle("imp", "bot")], npcs)
    ).toEqual(["Daemon", "Flying", "Mechanical"])
  })

  it("is empty without battles or npcs", () => {
    expect(listEnemyTraits([], npcs)).toEqual([])
    expect(listEnemyTraits([battle("bot")], new Map())).toEqual([])
  })
})
