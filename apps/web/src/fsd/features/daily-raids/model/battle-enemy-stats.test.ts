import { describe, expect, it } from "vitest"

import { battleEnemyStats } from "./battle-enemy-stats"

const npcs = new Map([
  [
    "necronWarrior",
    {
      factionId: "Necrons",
      stats: [
        { rank: 0, stars: 0, health: 100 },
        { rank: 3, stars: 1, health: 400 },
      ],
    },
  ],
  [
    "orkBoy",
    { factionId: "Orks", stats: [{ rank: 3, stars: 1, health: 300 }] },
  ],
])

describe("battleEnemyStats", () => {
  it("adds each enemy's health at its rank and stars, and counts enemies per faction", () => {
    const stats = battleEnemyStats(
      {
        detailedEnemyTypes: [
          { id: "necronWarrior", count: 3, rank: "Iron1", stars: 1 },
          { id: "orkBoy", count: 2, rank: "Iron1", stars: 1 },
        ],
      },
      npcs
    )
    expect(stats.health).toBe(3 * 400 + 2 * 300)
    expect(Object.fromEntries(stats.byFaction)).toEqual({
      Necrons: 3,
      Orks: 2,
    })
  })

  it("never guesses an unknown enemy or a rank its ladder lacks", () => {
    const stats = battleEnemyStats(
      {
        detailedEnemyTypes: [
          { id: "unknown", count: 4, rank: "Stone1", stars: 0 },
          { id: "orkBoy", count: 1, rank: "Gold1", stars: 3 },
        ],
      },
      npcs
    )
    expect(stats.health).toBe(0)
    expect(Object.fromEntries(stats.byFaction)).toEqual({ Orks: 1 })
  })
})
