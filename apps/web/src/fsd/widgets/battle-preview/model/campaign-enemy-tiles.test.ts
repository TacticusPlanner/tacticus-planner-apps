import { describe, expect, it } from "vitest"

import type { NpcRecord, NpcStatRow } from "@/entities/npc"

import { campaignEnemyTiles } from "./campaign-enemy-tiles"

const row = (rank: number, stars: number, health: number): NpcStatRow => ({
  abilityLevel: 1,
  damage: 10,
  armour: 5,
  health,
  progressionIndex: 0,
  rank,
  stars,
})

const grot = {
  id: "orksNpc1Grot",
  name: "Grot",
  stats: [row(0, 0, 40), row(1, 0, 50), row(1, 1, 55), row(2, 1, 69)],
} as unknown as NpcRecord
const npcs = new Map<string, NpcRecord>([[grot.id, grot]])

describe("campaignEnemyTiles", () => {
  it("resolves each enemy's level by its rank and stars", () => {
    const [tile] = campaignEnemyTiles(
      [{ id: "orksNpc1Grot", count: 3, rank: "Stone2", stars: 1 }],
      npcs
    )
    expect(tile).toMatchObject({
      npcId: "orksNpc1Grot",
      count: 3,
      level: "resolved",
      row: { rank: 1, stars: 1, health: 55 },
    })
  })

  it("shows level unknown when the ladder has no row at that rank and stars", () => {
    const [tile] = campaignEnemyTiles(
      [{ id: "orksNpc1Grot", count: 1, rank: "Gold3", stars: 4 }],
      npcs
    )
    expect(tile?.level).toBe("unknownLevel")
    expect(tile?.row).toBeUndefined()
  })

  it("shows level unknown for an NPC the dataset does not serve", () => {
    const [tile] = campaignEnemyTiles(
      [{ id: "unknownNpc", count: 1, rank: "Stone1", stars: 0 }],
      npcs
    )
    expect(tile).toMatchObject({ level: "unknownLevel", npc: undefined })
  })

  it("carries the npcs read state while it is pending", () => {
    const tiles = campaignEnemyTiles(
      [
        { id: "orksNpc1Grot", count: 2, rank: "Stone1", stars: 0 },
        { id: "orksNpc1Grot", count: 1, rank: "Iron1", stars: 0 },
      ],
      "pending"
    )
    expect(tiles.map((tile) => [tile.key, tile.level])).toEqual([
      ["enemy-0", "pending"],
      ["enemy-1", "pending"],
    ])
  })
})
